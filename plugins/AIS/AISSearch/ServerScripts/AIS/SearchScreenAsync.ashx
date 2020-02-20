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
							
						if (t.StartsWith("[mailru]"))
							return ( Regex.Replace(Regex.Replace(t, @"\[mailru\]\.", "", RegexOptions.IgnoreCase), @"[\[\]]", "\"", RegexOptions.IgnoreCase));
							
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
	
	private double[] GetBounds()
	{		
			double minX = double.Parse(_context.Request["minx"].Replace(',', '.'), new CultureInfo("En-us")), maxX = double.Parse(_context.Request["maxx"].Replace(',', '.'), new CultureInfo("En-us")),
				   minY = double.Parse(_context.Request["miny"].Replace(',', '.'), new CultureInfo("En-us")), maxY = double.Parse(_context.Request["maxy"].Replace(',', '.'), new CultureInfo("En-us"));
			double w = (maxX - minX) / 2;
			double[] bounds = { minX, minY, maxX, maxY };
			if (w >= 180)
			{
				bounds = new double[] { -180, minY, 180, maxY };
				//geo = { type: 'Polygon', coordinates: [[[-180, min.y], [-180, max.y], [180, max.y], [180, min.y], [-180, min.y]]] };
			}
			else if (maxX > 180 || minX < -180)
			{
				var center = ((maxX + minX) / 2) % 360;
				if (center > 180) { center -= 360; }
				else if (center < -180) { center += 360; }
				minX = center - w; maxX = center + w;
				//return new object[] { minX,center,maxX};
				if (minX < -180)
				{
					bounds = new double[] { 
					 -180,       minY, maxX, maxY , 
					 minX + 360, minY,  180, maxY
					};
					//geo = { type: 'MultiPolygon', coordinates: [
					//                [[[-180, min.y], [-180, max.y], [maxX, max.y], [maxX, min.y], [-180, min.y]]],
					//                [[[minX + 360, min.y], [minX + 360, max.y], [180, max.y], [180, min.y], [minX + 360, min.y]]]
					//            ]
					//};
				}
				else if (maxX > 180)
				{
					bounds = new double[] { 
					 minX, minY, 180,        maxY, 
					 -180, minY, maxX - 360, maxY
					};
					//geo = { type: 'MultiPolygon', coordinates: [
					//                [[[minX, min.y], [minX, max.y], [180, max.y], [180, min.y], [minX, min.y]]],
					//                [[[-180, min.y], [-180, max.y], [maxX - 360, max.y], [maxX - 360, min.y], [-180, min.y]]]
					//            ]
					//};
				}
				else 
				{
					bounds = new double[] { minX, minY, maxX, maxY };
				}
			}
			return bounds;
	
	}
	
	private class Result
	{
		public string[]	columns;
		public List<List<object>> values;
		public int[] elapsed;
		public string table;
		public Dictionary<string, int> groups;
		public Dictionary<string, int> groupsAlt;
	}
	
	private object GetResult()
	{
		try
		{
			DateTime begin = DateTime.Now; 
			string table = this.GetAttrTable(), filter = "";
			string start = _context.Request["s"], end = _context.Request["e"];
			var bounds = this.GetBounds();
			var result = new Result(){
				columns = new string[] { "vessel_name", "mmsi", "imo", "maxid", "xmin", "xmax", "ymin", "ymax", "vessel_type", "sog", "cog", "heading", "ts_pos_utc" },
				values = new List<List<object>>(),
				elapsed = new int[]{(int)(DateTime.Now-begin).TotalMilliseconds, 0},
				table = "",
				groups = new Dictionary<string, int>(),
				groupsAlt = new Dictionary<string, int>()
			};
            using (var conn = new NpgsqlConnection(_connStr))
			{
				var com = conn.CreateCommand();
				if (bounds.Length == 8)
				{
					com.CommandText = @"
	SELECT t.maxid, t.mmsi, t.imo, t.vessel_name, p.longitude xmin, p.longitude xmax, p.latitude ymin, p.latitude ymax, p.vessel_type, p.sog, p.cog, p.heading, p.ts_pos_utc FROM(
		SELECT MAX(maxid) maxid, mmsi, imo, vessel_name FROM (
			SELECT MAX(id) maxid, mmsi, imo, vessel_name FROM " + table + @"
			WHERE "+(filter!=""?filter+" and ":"")+@"
			(:minX1<=longitude and longitude<=:maxX1 and  
			:minY1<=latitude and latitude<=:maxY1) " +
			(start!=null && end!=null ? @"and((ts_pos_utc >= :s) and (ts_pos_utc < :e))" : @"") + @"
			GROUP BY mmsi, imo , vessel_name
			UNION 
			SELECT MAX(id) maxid, mmsi, imo, vessel_name FROM " + table + @"
			WHERE "+(filter!=""?filter+" and ":"")+@"
			(:minX2<=longitude and longitude<=:maxX2 and  
			:minY2<=latitude and latitude<=:maxY2) " +
			(start!=null && end!=null ? @"and((ts_pos_utc >= :s) and (ts_pos_utc < :e))" : @"") + @"
			GROUP BY mmsi, imo , vessel_name
		) tt 
		GROUP BY mmsi, imo , vessel_name
	) t, " + table + @" p WHERE t.maxid=p.id ORDER BY t.vessel_name 
	";
		
					com.Parameters.AddWithValue("minX1", bounds[0]);
					com.Parameters.AddWithValue("minY1", bounds[1]);
					com.Parameters.AddWithValue("maxX1", bounds[2]);
					com.Parameters.AddWithValue("maxY1", bounds[3]);
					com.Parameters.AddWithValue("minX2", bounds[4]);
					com.Parameters.AddWithValue("minY2", bounds[5]);
					com.Parameters.AddWithValue("maxX2", bounds[6]);
					com.Parameters.AddWithValue("maxY2", bounds[7]);
					if (start!=null && end!=null)
					{
						com.Parameters.AddWithValue("s", start);			
						com.Parameters.AddWithValue("e", end);
					}
				}
				else
				{
					com.CommandText = @"
	SELECT t.maxid, t.mmsi, t.imo, t.vessel_name, p.longitude xmin, p.longitude xmax, p.latitude ymin, p.latitude ymax, p.vessel_type, p.sog, p.cog, p.heading, p.ts_pos_utc FROM(
		SELECT MAX(id) maxid, mmsi, imo, vessel_name FROM " + table + @"
		WHERE "+(filter!=""?filter+" and ":"")+@"
		(:minX1<=longitude and longitude<=:maxX1 and  
		:minY1<=latitude and latitude<=:maxY1) " +
		(start!=null && end!=null ? @"and((ts_pos_utc >= :s) and (ts_pos_utc < :e))" : @"") + @"
		GROUP BY mmsi, imo , vessel_name
	) t, " + table + @" p WHERE t.maxid=p.id ORDER BY t.vessel_name
	";
	//throw new Exception(com.CommandText);
					com.Parameters.AddWithValue("minX1", bounds[0]);
					com.Parameters.AddWithValue("minY1", bounds[1]);
					com.Parameters.AddWithValue("maxX1", bounds[2]);
					com.Parameters.AddWithValue("maxY1", bounds[3]);
					if (start!=null && end!=null)
					{
						com.Parameters.AddWithValue("s", start);			
						com.Parameters.AddWithValue("e", end);
					}
				}

				begin = DateTime.Now;            
				conn.Open();
				var r = com.ExecuteReader();
				int vesNameCol = -1,
					vesTypeCol = -1,
					sogCol = -1,
					tsPosCol = -1;
				for (var i=0; i<result.columns.Length; ++i)
				{
					if (result.columns[i]=="ts_pos_utc")
						tsPosCol = i;
					else if (result.columns[i]=="vessel_name")
						vesNameCol = i; 
					else if (result.columns[i]=="vessel_type")
						vesTypeCol = i;
					else if (result.columns[i]=="sog")
						sogCol = i;
				
				}
					
				while (r.Read())
				{
					var vessel = new List<object>();
					for (var i=0; i<result.columns.Length; ++i)
					{
						if (result.columns[i]=="ts_pos_utc")
							vessel.Add(((DateTime)r[result.columns[i]]).Subtract(new DateTime(1970, 1, 1, 0, 0, 0)).TotalMilliseconds);
						else
							vessel.Add(r[result.columns[i]]);	
					}
					
							var vt = r[vesTypeCol].ToString();
							if (vt=="Pleasure Craft" || vt=="Sailing")
								vt = "Sailing";
							else if (vt=="Dredging" || vt=="Law Enforcement" || vt=="Medical Transport" || vt=="Military" || vt=="Pilot" || 
									 vt=="Port Tender" || vt=="SAR" || vt=="Ships Not Party to Armed Conflict" || vt=="Spare" || vt=="Towing" || 
									 vt=="Tug" || vt=="Vessel With Anti-Pollution Equipment" || vt=="WIG" || vt=="Diving")
								vt = "Pilot";
							else if (vt=="Unknown" || vt=="Reserved" || vt=="Other")
								vt = "Other";
							if (result.groups.ContainsKey(vt))
								result.groups[vt] = result.groups[vt] + 1;
							else
								result.groups[vt] = 1;

							var st = "undef";
							if ((int)r[sogCol]>=8 && r[vesNameCol].ToString()!="UNAVAILABLE")
								st = "8";
							else if (4<(int)r[sogCol] && (int)r[sogCol]<8 && r[vesNameCol].ToString()!="UNAVAILABLE")
								st = "6";
							else if (0<(int)r[sogCol] && (int)r[sogCol]<=4 && r[vesNameCol].ToString()!="UNAVAILABLE")
								st = "4";
							else if ((int)r[sogCol]==0 && r[vesNameCol].ToString()!="UNAVAILABLE")
								st = "0";
							if (result.groupsAlt.ContainsKey(st))
								result.groupsAlt[st] = result.groupsAlt[st] + 1;
							else
								result.groupsAlt[st] = 1;
							
								
					result.values.Add(vessel);
				}
				result.elapsed[1] = (int)(DateTime.Now-begin).TotalMilliseconds;
				result.table = table;
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
		_context.Response.Write(json);
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