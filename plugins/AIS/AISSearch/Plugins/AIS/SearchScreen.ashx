<%@ WebHandler Language="C#" Class="ScreenSearch" %>

using System;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using CommonWebUtil;
using System.Collections.Generic;
using System.Globalization;
using WebSecurity;

using Npgsql;

public class ScreenSearch : IHttpHandler {
 
    public bool IsReusable {
        get {
            return false;
        }
    }
	
    public void ProcessRequest(HttpContext context)
    { 
	
		var layerName = context.Request["layer"]==null ? "8EE2C7996800458AAF70BABB43321FA4" : context.Request["layer"];
		var prms = new LayerWeb.GetLayerInfo.LayerInfoParams { LayerName = layerName, NeedAttrValues = false };
		var li = LayerWeb.GetLayerInfo.GetInformation(prms, UserSecurity.GetUserFromRequset(context));
		if (li==null)
		{
			JsonResponse.WriteNotAuthenticatedToResponse("NOT AUTHORIZED", context);
			return;
		}
		
		try
		{           	
			string table, filter = "";
			if (li["TableName"]!=null)
				table = li["TableName"].ToString().Split('.')[2].Trim(new char[]{'[',']'});
			else if (li["ParentLayer"]!=null)
			{
				filter = li["Filter"].ToString().Replace("\"", "");			
				prms = new LayerWeb.GetLayerInfo.LayerInfoParams { LayerName = li["ParentLayer"].ToString(), NeedAttrValues = false };
				li = LayerWeb.GetLayerInfo.GetInformation(prms, UserSecurity.GetUserFromRequset(context));
				table = li["TableName"].ToString().Split('.')[2].Trim(new char[]{'[',']'});
			}	
			else
				throw new Exception("NO TABLE");
			
			switch(table)
			{
				case "ais_data":
					//table = "AISWFSPoints";
					table = "ais.ais_data";
					break;
				case "ais_last_data":
					//table = "AISWFSLastPoint";
					table = "ais.ais_last_data";
					break;
				default:
					throw new Exception("NO TABLE EQUIVALENT");
			}
				//throw new Exception(table);
		
			double minX = double.Parse(context.Request["minx"].Replace(',', '.'), new CultureInfo("En-us")), maxX = double.Parse(context.Request["maxx"].Replace(',', '.'), new CultureInfo("En-us")),
				   minY = double.Parse(context.Request["miny"].Replace(',', '.'), new CultureInfo("En-us")), maxY = double.Parse(context.Request["maxy"].Replace(',', '.'), new CultureInfo("En-us"));
			string start = context.Request["s"], end = context.Request["e"];        
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
			//return bounds;
			var result = new
			{
				columns = new string[] { "vessel_name", "mmsi", "imo", "maxid", "xmin", "xmax", "ymin", "ymax", "vessel_type", "sog", "cog", "heading", "ts_pos_utc" },
				values = new List<List<object>>(),
				elapsed = new int[]{0}
			};

            using (var conn = new NpgsqlConnection("Host=10.1.2.25;Port=5432;User ID=postgres; Password=PgKosmo; Database=maps; CommandTimeout=6000; Timeout=1024; Pooling=true; MinPoolSize=1; MaxPoolSize=20"))
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

				var begin = DateTime.Now;            
				conn.Open();
				var r = com.ExecuteReader();
				result.elapsed[0] = (int)(DateTime.Now-begin).TotalMilliseconds;
				
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
					result.values.Add(vessel);
				}
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