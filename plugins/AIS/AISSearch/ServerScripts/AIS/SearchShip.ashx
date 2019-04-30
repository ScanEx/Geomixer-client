<%@ WebHandler Language="C#" Class="ScreenShip" %>

using System;
using System.Text.RegularExpressions;
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
using NpgsqlTypes;


public class ScreenShip : IHttpHandler {
 
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
	
    public bool IsReusable {
        get {
            return false;
        }
    }
	
    public void ProcessRequest(HttpContext context)
    { 	
		var layerName = context.Request["layer"]==null ? "8EE2C7996800458AAF70BABB43321FA4" : context.Request["layer"];
		//var prms = new LayerWeb.GetLayerInfo.LayerInfoParams { LayerName = layerName, NeedAttrValues = false };
		//var li = LayerWeb.GetLayerInfo.GetInformation(prms, UserSecurity.GetUserFromRequset(context));		
		//if (li==null)
		//{
		//	JsonResponse.WriteNotAuthenticatedToResponse("NOT AUTHORIZED", context);
		//	return;
		//}
	
		var begin = DateTime.Now;	
		try
		{  		
			var table = "ais.ais_last_data";		
			var connString = GetConnectionString(context);
			
			if (context.Request["layer"]!=null)
			{ 				
				if (context.Cache["GT_"+layerName]==null)
				{
					using (var conn = new NpgsqlConnection(connString.Replace("maps", "maps_sys")))
					{
						var com = conn.CreateCommand();	
						com.CommandText = @"select ""GeometryTable"" from gm_sys.""Layer"" where ""Name""=:layerName";
						com.Parameters.AddWithValue("layerName", layerName);
						conn.Open();
						var r = com.ExecuteReader();
						if (r.Read())
							table = r[0].ToString();
						else
							throw new Exception("UKNOWN LAYER");
						table = table.Replace("[mailru].", "").Replace("[", "").Replace("]", "");						
					}
					context.Cache.Insert("GT_"+layerName, table, null, DateTime.Now.AddSeconds(60*5), System.Web.Caching.Cache.NoSlidingExpiration);
				}
				else
					table = context.Cache["GT_"+layerName].ToString();
			}
			//JsonResponse.WriteResultToResponse(table, context);
			//return;	
				
			var query = context.Request["query"];
			if (query==null)
				throw new Exception("EMPTY REQUEST");
			query = query.ToUpper();

			var result = new
			{
				columns = new string[] { "vessel_name", "mmsi", "imo", "ts_pos_utc", "vessel_type", "longitude", "latitude", "id", "source" },
				values = new List<List<object>>(),
				elapsed = new int[]{0, 0},
				table = table
			};

            using (var conn = new NpgsqlConnection(connString))
			{
				var com = conn.CreateCommand();				
				var whereClause = "t.vessel_name LIKE :vname1 OR t.vessel_name LIKE :vname2";
				//var whereClause = "t.vessel_name~*:vname1 OR t.vessel_name~*:vname2";
				if (System.Text.RegularExpressions.Regex.IsMatch(query, "[^\\d, ]"))
				{
					com.Parameters.AddWithValue("vname1", query + "%");	
					com.Parameters.AddWithValue("vname2", "% " + query + "%");
					//com.Parameters.AddWithValue("vname1", "^" + query + ".*");	
					//com.Parameters.AddWithValue("vname2", ".+ " + query + ".*");
				}
				else
				{
					var list = new List<int>();
					char[] sep = {',', ' '};
					var qa = query.Split(sep, StringSplitOptions.RemoveEmptyEntries).Select(s=>int.Parse(s.Trim()));
					//throw new Exception(String.Join(",", qa));
					whereClause = @"""mmsi""=ANY(:varray) OR ""imo""=ANY(:varray)";
					com.Parameters.Add("varray", NpgsqlDbType.Array | NpgsqlDbType.Integer).Value = qa;
				}
				
				com.CommandText = @"
	SELECT t.vessel_name, t.mmsi, t.imo, t.ts_pos_utc, t.vessel_type, t.longitude, t.latitude, t.id, t.source 
	FROM " + table + @" t
    WHERE " + whereClause + 
	@" LIMIT 1000
	";
            
				conn.Open();
				var r = com.ExecuteReader();
				result.elapsed[0] = (int)(DateTime.Now-begin).TotalMilliseconds;
				
			//JsonResponse.WriteResultToResponse(null, context);
			//return;
				
				while (r.Read())
				{
					var vessel = new List<object>();
					for (var i=0; i<result.columns.Length; ++i)
					{
						if (result.columns[i]=="ts_pos_utc")
							vessel.Add(((DateTime)r[result.columns[i]]).Subtract(new DateTime(1970, 1, 1, 0, 0, 0)).TotalSeconds);
						else if (result.columns[i]=="vessel_name")
							vessel.Add(Regex.Replace(r[result.columns[i]].ToString(), @"\s+", " ", RegexOptions.IgnoreCase));
						else
							vessel.Add(r[result.columns[i]]);
					}
					result.values.Add(vessel);
				}
				result.values.Sort((x, y) => x[0].ToString().CompareTo(y[0].ToString()));
				result.elapsed[1] = (int)(DateTime.Now-begin).TotalMilliseconds;
			}
			//return result;
	
			JsonResponse.WriteResultToResponse(result, context);
		
        }
        catch (Exception ex)
        {
            System.Diagnostics.Trace.TraceError("Error: {0}, StackTrace: {1}", ex.Message, ex.StackTrace);
            JsonResponse.WriteExceptionToResponse(ex, context);
        }
		WebHelper.CompressOutputStream(context);		
    }

}