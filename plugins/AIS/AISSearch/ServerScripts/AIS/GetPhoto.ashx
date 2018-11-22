<%@ WebHandler Language="C#" Class="GetPhoto" %>
using System;
using System.Web;
using System.IO;
using System.Data;
using Npgsql;
 
public class GetPhoto : IHttpHandler {
   
    public void ProcessRequest (HttpContext context) {

		var response = context.Response; 
		int param1; 
		string file = "";

		if (int.TryParse(context.Request["mmsi"], out param1))
		{		
			using (var conn = new NpgsqlConnection(""))
			{
				using (var command = new NpgsqlCommand("SELECT id from picture WHERE mmsi=:param1", conn))
				{
					command.Parameters.AddWithValue("param1", param1);
					conn.Open();
					var id = command.ExecuteScalar();
					file = String.Format("small\\{0}.jpg", id);
					conn.Close();
				}
			}	
		}
		else if (int.TryParse(context.Request["id"], out param1))
			file = String.Format("middle\\{0}.jpg", param1);		
		if (file!="")
			file = "X:\\kosmosnimki\\maritime\\vesselgalery\\" + file;
		if (file!="" && File.Exists(file))
		{		
			byte[] imageBytes = File.ReadAllBytes(file);
			response.Clear();  
			response.Buffer = true;  
			response.Charset = "";  
			//response.Cache.SetCacheability(HttpCacheability.NoCache);  
			response.ContentType = "image/jpg";  
			response.BinaryWrite(imageBytes);  
			response.Flush(); 
		}
		else
			response.StatusCode = 404; 
        response.End();  
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }
}
