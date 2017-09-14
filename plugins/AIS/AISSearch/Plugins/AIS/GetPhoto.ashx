<%@ WebHandler Language="C#" Class="Upload" %>
using System;
using System.Web;
using System.IO;
using System.Data;
using System.Data.SqlClient;
 
public class Upload : IHttpHandler {
   
    public void ProcessRequest (HttpContext context) {

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
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }
}
