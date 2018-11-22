<%@ WebHandler Language="C#" Class="Gallery" %>

using System;
using System.Web;
using System.Data;
using System.Data.SqlClient;
using CommonWebUtil;
using System.Collections.Generic;
using System.Globalization;
using Npgsql;

public class Gallery : JsonHandlerPublic {
    
    protected override object GetResult(HttpContext context)
    {
        int mmsi = int.Parse(context.Request["mmsi"]),
            imo = int.Parse(context.Request["imo"]);

        var result = new List<int>();
		
		using (var conn = new NpgsqlConnection(""))
		{
			string sQL = "SELECT id from picture WHERE mmsi=:mmsi and imo=:imo";
			using (var command = new NpgsqlCommand(sQL, conn))
			{
				command.Parameters.AddWithValue("mmsi", mmsi);
				command.Parameters.AddWithValue("imo", imo);
				conn.Open();
				var r = command.ExecuteReader();
				while (r.Read())
				{
					result.Add((int)r[0]);
				}
				conn.Close();
			}
		}		

		
        return result;
    }

}