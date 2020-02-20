<%@ WebHandler Language="C#" Class="ScreenSearchAsync" %>

using System;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using CommonWebUtil;
using System.Collections.Generic;
using System.Globalization;
using WebSecurity;

using System.Text.RegularExpressions;
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

public class ScreenSearchAsync : IHttpAsyncHandler {
 
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
			var user = UserSecurity.GetUserFromRequset(_context);
			if (user==null)
				return ("NOT AUTHENTICATED");
				
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
							
						if (t.StartsWith("[mailru]"))
							return ( Regex.Replace(Regex.Replace(t, @"\[mailru\]\.", "", RegexOptions.IgnoreCase), @"[\[\]]", "\"", RegexOptions.IgnoreCase));
							
						switch(t)
						{
							case "1":								
								return("NO AUTHORIZED");
							default:
								throw new Exception("NO TABLE FOUND");
						}
					}
					else
						throw new Exception("NO TABLE FOUND");
					reader.Close();
					conn.Close();
				}
			}
	}
	
	private class Result
	{
		public string[]	fields;
		public List<List<object>> values;
		public int[] elapsed;
		public string table;
	}
	
	private object GetResult()
	{
		try
		{
			DateTime begin = DateTime.Now; 
			string table = GetAttrTable();
				
			string mmsi = _context.Request["mmsi"], start = _context.Request["s"], end = _context.Request["e"];

			var dtstart = DateTime.Parse(start);
			var dtend = DateTime.Parse(end);
			var days = (dtend - dtstart).Days;			
			// LIMITS
			if (table=="NOT AUTHENTICATED" || table=="NO AUTHORIZED")
			{
				if (dtend<DateTime.UtcNow.Date.AddDays(1))
				{
					dtend = DateTime.UtcNow.Date.AddDays(1);
					if (days<=3)
					{
						dtstart = dtend.AddDays(-days);			
						start = dtstart.ToString("o");
					}
					end = dtend.ToString("o");					
				}
				if (days>3)
				{
					dtstart = dtend.AddDays(-3);			
					start = dtstart.ToString("o");
				}

//throw new Exception(String.Format("S={0} E={1}", start, end));
			}
			else
			{
				if(days>30)
				{
					dtstart = dtend.AddDays(-30);			
					start = dtstart.ToString("o");
				}
			}
			var result = new Result(){			
				fields = new string[] { "mmsi","imo","flag_country","callsign","ts_pos_utc","cog","sog","draught","vessel_type","destination","ts_eta","nav_status","heading","rot","longitude","latitude","source" },
				values = new List<List<object>>(),
				elapsed = new int[]{(int)(DateTime.Now-begin).TotalMilliseconds, 0},
				table = table
			};
            using (var conn = new NpgsqlConnection(_connStr))
			{
				var com = conn.CreateCommand();
					com.CommandText = "SELECT " + String.Join(",", result.fields) + " FROM ais.ais_data WHERE mmsi=:mmsi AND :s<=ts_pos_utc AND ts_pos_utc<:e ORDER BY ts_pos_utc DESC";
//throw new Exception(com.CommandText);
				com.Parameters.AddWithValue("mmsi", mmsi);	
				com.Parameters.AddWithValue("s", start);			
				com.Parameters.AddWithValue("e", end);
				begin = DateTime.Now;            
				conn.Open();
				var r = com.ExecuteReader();				
				while (r.Read())
				{
					var vessel = new List<object>();
					for (var i=0; i<result.fields.Length; ++i)
					{
						if (result.fields[i]=="ts_pos_utc" || result.fields[i]=="ts_eta")
							vessel.Add(((DateTime)r[result.fields[i]]).Subtract(new DateTime(1970, 1, 1, 0, 0, 0)).TotalSeconds);
						else
							vessel.Add(r[result.fields[i]]);
					}
					result.values.Add(vessel);
				}
				result.elapsed[1] = (int)(DateTime.Now-begin).TotalMilliseconds;
			}
			return result;		
		}
		catch(Exception e)
		{
			return e;
		}	
	}

	private delegate object AsyncMethodCaller();	
	private HttpContext _context;
	private string _origin;
    private AsyncMethodCaller _caller;	
	
    public IAsyncResult BeginProcessRequest(HttpContext context, 
                        AsyncCallback cb, object extraData)
    {
		_context = context;
		_origin =  _context.Request.Headers["Origin"];
		_connStr = GetConnectionString(context);
        _caller = new AsyncMethodCaller(GetResult);
		IAsyncResult asyncResult = _caller.BeginInvoke(cb, extraData);	
        return asyncResult;
    }

    public void EndProcessRequest(IAsyncResult asyncResult)
    {
		object result = _caller.EndInvoke(asyncResult);
		//HttpContext.Current = _context;
		
		string json;
		if (result is AuthenticationException)
			json = JsonConvert.SerializeObject(new {Status="error", ErrorInfo=result});
		//	JsonResponse.WriteNotAuthenticatedToResponse((result as AuthenticationException).Message, _context);
		if (result is AuthorizationException)
			json = JsonConvert.SerializeObject(new {Status="error", ErrorInfo=result});
		//	JsonResponse.WriteNotAuthenticatedToResponse((result as AuthorizationException).Message, _context);			
		else if (result is Exception)
			json = JsonConvert.SerializeObject(new {Status="error", ErrorInfo=result});
		//	JsonResponse.WriteExceptionToResponse((Exception)result, _context);	
		else
			json = JsonConvert.SerializeObject(new {Status="ok", Result=result});
		//	JsonResponse.WriteResultToResponse((Result)result, _context);
		_context.Response.Clear();
		_context.Response.ContentType = "application/json; charset=utf-8";
		if (String.IsNullOrEmpty(_origin))
			_origin = "*";
		_context.Response.Headers.Add("Access-Control-Allow-Origin", _origin);		
		_context.Response.Headers.Add("Access-Control-Allow-Credentials", "true");
		_context.Response.Write(_context.Request["CallbackName"]!=null?String.Format("{0}({1})", _context.Request["CallbackName"], json):json);
		WebHelper.CompressOutputStream(_context);
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