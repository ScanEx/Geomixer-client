<%@ WebHandler Language="C#" Class="GetPhoto" %>
using System;
using System.Web;
using System.IO;
using System.Data;
//using System.Data.SqlClient;
using Npgsql;
 
public class GetPhoto : IHttpHandler {
   
    public void ProcessRequest (HttpContext context) {

		var response = context.Response; 
		int param1, param2;
		string sQL = "SELECT middle from picture WHERE id=:param1";
		if (int.TryParse(context.Request["id"], out param1))
		{
			sQL = "SELECT middle from picture WHERE id=:param1";
		}
		else if (int.TryParse(context.Request["mmsi"], out param1))
		{
			sQL = "SELECT small from picture WHERE mmsi=:param1";
		}
		
		byte[] imageBytes = null;	
		
		using (var conn = new NpgsqlConnection("Server=192.168.14.190; Port = 5432; User id=postgres;password=postgres;Database=VesselGallery"))
		{
			using (var command = new NpgsqlCommand(sQL, conn))
			{
				command.Parameters.AddWithValue("param1", param1);
				conn.Open();
				var rdr = command.ExecuteReader();
				if (rdr.Read())
				{
					imageBytes = (byte[])rdr[0];
				}
				rdr.Close();
				conn.Close();
			}
		}

        response.Clear();  
        response.Buffer = true;  
        response.Charset = "";  
        response.Cache.SetCacheability(HttpCacheability.NoCache);  
        response.ContentType = "image/jpg";  
        //response.AppendHeader("Content-Disposition", "attachment; filename=" + fileName);  
        response.BinaryWrite(imageBytes);  
        response.Flush();   
        response.End();  
		
		/*
        var constr = "Data Source=KOSMO-MSSQL2.kosmosnimki.ru;Failover Partner=KOSMO-MSSQL1.kosmosnimki.ru;Initial Catalog=Maps;User Id=Maps1410;Password=8ewREh4z";
        var Response = context.Response; 
        int id = int.Parse(context.Request["id"]);  
        byte[] bytes;  
        string fileName, contentType;  
        //string constr = ConfigurationManager.ConnectionStrings["constr"].ConnectionString;  
        using (SqlConnection con = new SqlConnection(constr))  
        {  
            using (SqlCommand cmd = new SqlCommand())  
            {  
                cmd.CommandText = "select Data, ContentType from AIS_Gallery where id=@Id";  
                cmd.Parameters.AddWithValue("@Id", id);  
                cmd.Connection = con;  
                con.Open();  
                using (SqlDataReader sdr = cmd.ExecuteReader())  
                {  
                    sdr.Read();  
                    bytes = (byte[])sdr["Data"];  
                    contentType = sdr["ContentType"].ToString();  
                }  
                con.Close();  
            }  
        }  
        Response.Clear();  
        Response.Buffer = true;  
        Response.Charset = "";  
        Response.Cache.SetCacheability(HttpCacheability.NoCache);  
        Response.ContentType = contentType;  
        //Response.AppendHeader("Content-Disposition", "attachment; filename=" + fileName);  
        Response.BinaryWrite(bytes);  
        Response.Flush();   
        Response.End();  
		*/
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }
}
