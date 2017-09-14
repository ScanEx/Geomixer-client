<%@ WebHandler Language="C#" Class="ScreenSearch" %>

using System;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using CommonWebUtil;
using System.Collections.Generic;
using System.Globalization;

public class ScreenSearch : JsonHandlerPublic {
    
//Object { x: -214.508056640625, y: 56.23724470041031 }
//Object { x: -207.26806640625, y: 61.18562468142281 }
    
    protected override object GetResult(HttpContext context)
    {
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
            columns = new string[] { "vessel_name", "mmsi", "imo", "maxid", "xmin", "xmax", "ymin", "ymax" },
            values = new List<List<object>>(),
            elapsed = new int[]{0}
        };
        
        using (var conn = new SqlConnection("Data Source=KOSMO-MSSQL2.kosmosnimki.ru;Failover Partner=KOSMO-MSSQL1.kosmosnimki.ru;Initial Catalog=Maps;User Id=Maps1410;Password=8ewREh4z"))
        {
            var com = conn.CreateCommand();
            if (bounds.Length == 8)
            {
                com.CommandText = @"
SELECT t.maxid, t.mmsi, t.imo, t.vessel_name, p.longitude xmin, p.longitude xmax, p.latitude ymin, p.latitude ymax FROM(
    SELECT MAX(maxid) maxid, mmsi, imo, vessel_name FROM (
        SELECT MAX(id) maxid, mmsi, imo, vessel_name FROM AISWFSPoints
        WHERE 
        (@minX1<=longitude and longitude<=@maxX1 and  
        @minY1<=latitude and latitude<=@maxY1) and
        (([ts_pos_utc] >= @s) and ([ts_pos_utc] < @e))
        GROUP BY mmsi, imo , vessel_name
        UNION 
        SELECT MAX(id) maxid, mmsi, imo, vessel_name FROM AISWFSPoints
        WHERE 
        @minX2<=longitude and longitude<=@maxX2 and  
        @minY2<=latitude and latitude<=@maxY2 and
        (([ts_pos_utc] >= @s) and ([ts_pos_utc] < @e))
        GROUP BY mmsi, imo , vessel_name
    ) tt 
    GROUP BY mmsi, imo , vessel_name
) t, AISWFSPoints p WHERE t.maxid=p.id ORDER BY t.vessel_name 
";
                var p = new SqlParameter("@s", start); com.Parameters.Add(p);
                    p = new SqlParameter("@e", end); com.Parameters.Add(p);
                    p = new SqlParameter("@minX1", bounds[0]); com.Parameters.Add(p);
                    p = new SqlParameter("@minY1", bounds[1]); com.Parameters.Add(p);
                    p = new SqlParameter("@maxX1", bounds[2]); com.Parameters.Add(p);
                    p = new SqlParameter("@maxY1", bounds[3]); com.Parameters.Add(p);
                    p = new SqlParameter("@minX2", bounds[4]); com.Parameters.Add(p);
                    p = new SqlParameter("@minY2", bounds[5]); com.Parameters.Add(p);
                    p = new SqlParameter("@maxX2", bounds[6]); com.Parameters.Add(p);
                    p = new SqlParameter("@maxY2", bounds[7]); com.Parameters.Add(p);
            }
            else
            {
                com.CommandText = @"
SELECT t.maxid, t.mmsi, t.imo, t.vessel_name, p.longitude xmin, p.longitude xmax, p.latitude ymin, p.latitude ymax FROM(
    SELECT MAX(id) maxid, mmsi, imo, vessel_name FROM AISWFSPoints
    WHERE 
    (@minX1<=longitude and longitude<=@maxX1 and  
    @minY1<=latitude and latitude<=@maxY1) and
    (([ts_pos_utc] >= @s) and ([ts_pos_utc] < @e))
    GROUP BY mmsi, imo , vessel_name
) t, AISWFSPoints p WHERE t.maxid=p.id ORDER BY t.vessel_name
";
                var p = new SqlParameter("@s", start); com.Parameters.Add(p);
                p = new SqlParameter("@e", end); com.Parameters.Add(p);
                p = new SqlParameter("@minX1", bounds[0]); com.Parameters.Add(p);
                p = new SqlParameter("@minY1", bounds[1]); com.Parameters.Add(p);
                p = new SqlParameter("@maxX1", bounds[2]); com.Parameters.Add(p);
                p = new SqlParameter("@maxY1", bounds[3]); com.Parameters.Add(p);
            }

            var begin = DateTime.Now;            
            conn.Open();
            var r = com.ExecuteReader();
            result.elapsed[0] = (int)(DateTime.Now-begin).TotalMilliseconds;
            
            while (r.Read())
            {
                var vessel = new List<object>();
                for (var i=0; i<result.columns.Length; ++i)
                    vessel.Add(r[result.columns[i]]);
                result.values.Add(vessel);
            }
        }
        return result;
    }

}