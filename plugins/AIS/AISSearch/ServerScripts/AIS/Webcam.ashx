<%@ WebHandler Language="C#" Class="Webcam" %>

using System;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using CommonWebUtil;
using System.Collections.Generic;
using System.Globalization;
using WebSecurity;

using System.IO;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

using Npgsql;

internal class AuthenticationException: Exception
{
	public AuthenticationException(string m):base(m) { }
}

internal class AuthorizationException: Exception
{
	public AuthorizationException(string m):base(m) { }
}

public class Webcam : IHttpAsyncHandler {
 
	private string _connStr;
	
	private string GetConnectionString(HttpContext context)
	{
		var cs = context.Cache["GM_Config"];
		if (cs==null)
		{
			var file = context.Request.ServerVariables["APPL_PHYSICAL_PATH"] + "geomixer.config";
			var txt = File.ReadAllText(file);
			var config = (JObject)JsonConvert.DeserializeObject(txt.ToString());
			var mailru = (JObject)(((JArray)config["DataBases"]["ExtendDb"]).SingleOrDefault(db=>db["Alias"].ToString()=="mailru"));
			if (mailru==null) throw new Exception("Failed extract connection string");
			cs = mailru["ConnStr"].ToString();
			context.Cache.Insert("GM_Config", cs, null, DateTime.Now.AddSeconds(60*5), System.Web.Caching.Cache.NoSlidingExpiration);
		}
		return cs.ToString();
	}

	private string GetAttrTable()
	{
			//return UserSecurity.GetUserFromRequset(_context).Role.ToString();

			var user = UserSecurity.GetUserFromRequset(_context);
			if (user==null)
				throw new AuthenticationException("NOT AUTHENTICATED");
				
			using(var conn = new NpgsqlConnection(_connStr.Replace("maps", "maps_sys"))){
				var comm = conn.CreateCommand();

					comm.CommandText = @"WITH RECURSIVE 
	groups(gid, uid, level) AS (
		SELECT ""GroupID"" gid, ""UserID"" uid, 1 ""level"" from gm_sys.""UserMembers"" WHERE ""UserID""=:user
		UNION ALL
		SELECT ""GroupID"" gid, ""UserID"" uid, g.""level"" + 1 ""level""
		FROM groups g, gm_sys.""UserMembers"" um
		WHERE g.gid = um.""UserID""
	)
	, principals AS (
		SELECT gid::text id FROM groups
		UNION
		SELECT ""UserID""::text FROM gm_sys.""User"" WHERE ""UserID""=:user
	)
	, layer_info AS (SELECT ""AccessInfo"", ""OwnerID"", ""GeometryTable"" FROM gm_sys.""Layer"" WHERE ""Name""=:layer)
	, granted AS (
		SELECT ((json_array_elements(""AccessInfo""::json->'AccessList'))->'UserID')::text pid, ""GeometryTable"" FROM layer_info
		UNION SELECT ""OwnerID""::text, ""GeometryTable"" FROM layer_info
		UNION SELECT u.""UserID""::text, ""GeometryTable"" FROM layer_info li, gm_sys.""User"" u WHERE u.""UserID""=:user and u.""Role""='admin'
		UNION SELECT '*', ""GeometryTable"" FROM layer_info WHERE ""AccessInfo"" is null
	)
	SELECT ""GeometryTable"", (select count(*) from layer_info) ""Success"" FROM principals p LEFT JOIN granted acl ON acl.pid=p.id OR acl.pid='*' ORDER BY ""GeometryTable""";
				comm.Parameters.AddWithValue("user", user.UserID.ToString());
				comm.Parameters.AddWithValue("layer", _context.Request["layer"]);
				conn.Open();
				using(var reader = comm.ExecuteReader())
				{
					if (reader.Read())
					{
						var t = reader["GeometryTable"].ToString();
						var success = reader["Success"];
						if (t=="")
							t+=success;
						switch(t)
						{
							case "[mailru].[ais].[ais_data]":
								return "ais.ais_data";
							case "[mailru].[ais].[ais_last_data]":
								return "ais.ais_last_data";
							case "[mailru].[ais].[csms_ais_last_data]":
								return "ais.csms_ais_last_data";
							case "1":								
								throw new AuthorizationException("NO AUTHORIZED");
							default:
								return t;
						}
					}
					else
						throw new Exception("NO TABLE FOUND");
					reader.Close();
					conn.Close();
				}
			}

	}
	
	private object GetResult()
	{
		try
		{
			DateTime begin = DateTime.Now; 
			string table = this.GetAttrTable(), filter = "";
			string start = _context.Request["s"], end = _context.Request["e"];
			var elapsed1 = (int)(DateTime.Now-begin).TotalMilliseconds;
			var elapsed2 = -1;
			var path = "";
			var request = _context.Request;
			using (var conn = new NpgsqlConnection(_connStr))
			{
				var com = conn.CreateCommand();
					com.CommandText = @"SELECT url FROM ais.scf_webcams WHERE mmsi = :mmsi AND ts <= :ts ORDER BY ts DESC";		
					com.Parameters.AddWithValue("mmsi", request["mmsi"]);
					com.Parameters.AddWithValue("ts", request["ts"]);

				begin = DateTime.Now;            
				conn.Open();
				var r = com.ExecuteReader();				
				if (r.Read())
					path = r[0].ToString();
				elapsed2 = (int)(DateTime.Now-begin).TotalMilliseconds;
			}

			return File.ReadAllBytes(path);
			//return new {
			//	path = path,
			//	elapsed = new int[]{elapsed1, elapsed2}
			//};		
		}
		catch(Exception e)
		{
			return e;
		}	
	}

	private delegate object AsyncMethodCaller();	
	private HttpContext _context;
    private AsyncMethodCaller _caller;	
	
    public IAsyncResult BeginProcessRequest(HttpContext context, 
                        AsyncCallback cb, object extraData)
    {
		_context = context;
		_connStr = GetConnectionString(context);
        _caller = new AsyncMethodCaller(GetResult);
		IAsyncResult asyncResult = _caller.BeginInvoke(cb, extraData);	
        return asyncResult;
    }

    public void EndProcessRequest(IAsyncResult asyncResult)
    {
		object result = _caller.EndInvoke(asyncResult);
		HttpContext.Current = _context;
		var response = _context.Response;
		if (result is AuthenticationException)	
			response.StatusCode = 401;	
			//JsonResponse.WriteNotAuthenticatedToResponse((result as AuthenticationException).Message, _context);
		else if (result is AuthorizationException)	
			response.StatusCode = 403;
			//JsonResponse.WriteNotAuthenticatedToResponse((result as AuthorizationException).Message, _context);			
		else if (result is Exception)	
			response.StatusCode = 404;
			//JsonResponse.WriteExceptionToResponse((Exception)result, _context);	
		else
		{			
			response.Clear();  
			response.Buffer = true;  
			response.Charset = "";  
			response.Cache.SetCacheability(HttpCacheability.NoCache);  
			response.ContentType = "image/jpg"; 
			response.BinaryWrite((byte[])result);  
			response.Flush(); 
		}  
		response.End();  
    }	
	 
    public void ProcessRequest(HttpContext context)
    {
        throw new NotImplementedException();
    }
	
    public bool IsReusable {
        get {
            return true;
        }
    }
}