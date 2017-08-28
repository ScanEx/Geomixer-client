<%@ WebHandler Language="C#" Class="Upload" %>
using System;
using System.Web;
using System.IO;
using System.Data;
using System.Data.SqlClient;
 
public class Upload : IHttpHandler {
   
    public void ProcessRequest (HttpContext context) {
        context.Response.ContentType = "text/html";
        context.Response.Expires = -1;
        try
        {
            if (context.Request.Files.Count == 0 || context.Request.Files["Filedata"].ContentLength==0)
                throw new Exception("Upload: no files");
            HttpPostedFile postedFile = context.Request.Files["Filedata"];
            if (postedFile.ContentLength>(Math.Pow(10,6)))
                throw new Exception(String.Format("Upload: {0} too much data", postedFile.ContentLength));
            int mmsi = int.Parse(context.Request["mmsi"]);
            int imo = int.Parse(context.Request["imo"]);
            string filename = postedFile.FileName;
            string ct = postedFile.ContentType;
            //postedFile.SaveAs(@"\" + filename);

            var id = 0;
            using (BinaryReader br = new BinaryReader(postedFile.InputStream))
            {
                byte[] bytes = br.ReadBytes((Int32)postedFile.InputStream.Length);
                using (var conn = new SqlConnection("Data Source=KOSMO-MSSQL2.kosmosnimki.ru;Failover Partner=KOSMO-MSSQL1.kosmosnimki.ru;Initial Catalog=Maps;User Id=Maps1410;Password=8ewREh4z"))
                {
                    string query = "insert into AIS_Gallery output inserted.id values (@mmsi, @imo, @ContentType, @Data)";
                    using (SqlCommand cmd = new SqlCommand(query))
                    {
                        cmd.Connection = conn;
                        cmd.Parameters.AddWithValue("@mmsi", mmsi);
                        cmd.Parameters.AddWithValue("@imo", imo);
                        cmd.Parameters.AddWithValue("@ContentType", ct);
                        cmd.Parameters.AddWithValue("@Data", bytes);
                        conn.Open();
                        id = (int)cmd.ExecuteScalar();
                        conn.Close();
                    }
                }
            }
            
            context.Response.Write(String.Format(
            @"<script language=""javascript"" type=""text/javascript"">
            window.top.window.vessel_info_page.uploaded({0})
            </script>", id));
        }
        catch (Exception ex)
        {
            context.Response.Write(String.Format(
                @"<script language=""javascript"" type=""text/javascript"">
            window.top.window.vessel_info_page.uploadError('{0}')
            </script>", ex.Message));
        }
        context.Response.StatusCode = 200;
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }
}
