<%@ WebHandler Language="C#" Class="VesselGallery.GetImage" %>
using System;
using System.Web;
using System.Net;
using System.IO;
using System.Data;
using System.Data.SqlClient;
using Npgsql;
 
namespace VesselGallery
{
	public class GetImage : IHttpHandler {
		
		public void ProcessRequest (HttpContext context) {
			var response = context.Response; 
			byte[] imageBytes = null;	
			var n = context.Request["n"] ?? "1";
			
			//if (n=="1") n+="2";
			
			HttpWebRequest myRequest = (HttpWebRequest)WebRequest.Create(String.Format("http://194.190.129.43/ships/foto/50letpobedy{0}.jpg", n));
			myRequest.Method = "GET";
			using(WebResponse myResponse = myRequest.GetResponse())
			using(MemoryStream ms = new MemoryStream()){
				myResponse.GetResponseStream().CopyTo(ms);
				imageBytes = ms.ToArray();
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
		}
	 
		public bool IsReusable {
			get {
				return false;
			}
		}
	}
}
