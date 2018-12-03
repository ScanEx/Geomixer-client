<%@ WebHandler Language="C#" Class="LloydsExport" %>
using System;
using System.Web;
using System.IO;
using System.Data;
using WebSecurity;
using LayerData;
using System.Linq;
using System.Collections.Generic;
using Npgsql;
 
public class LloydsExport : IHttpHandler//, IRequiresSessionState
{
	private void CheckCors(HttpRequest request, HttpResponse response)
	{	
		if (request.Headers["origin"]!=null) 
		{
			response.Headers.Add("Access-Control-Allow-Origin", request.Headers["origin"]); //				
			response.Headers.Add("Access-Control-Allow-Credentials", "true");
		}
	}
   
    public void ProcessRequest (HttpContext context) {
	
		var response = context.Response;
		var request = context.Request;
		var cache = context.Cache;
		response.Expires = -1;
		try
		{
			
			var u = UserSecurity.MyGetUserFromRequest(context);
			if (u==null)
				throw new Exception("You must to be authenticated");
			if (!UserAccess.CanUserViewUser(UserSecurity.MyGetUserFromRequest(context), u)) 
				throw new Exception("You can not view this user");
			if (!u.RequestMemberOfGroups().Any(g=>g.Nickname.ToLower()=="scanex_all") && u.Role!="admin")
				throw new Exception("You are not authorized");
				
			//throw new Exception("Currently unavailable");
			
			if (request.Form["columns"]!=null && request.Form["vessels"]!=null)
			{
				CheckCors(request, response);
				response.ContentType = "text/html";
				var collectionId = Guid.NewGuid().ToString("N");
				var collection = new Dictionary<string, string>{{"vessels", request["vessels"].ToString()}, {"columns", request["columns"].ToString()}};
				cache.Insert(collectionId, collection, null, DateTime.Now.AddSeconds(600), System.Web.Caching.Cache.NoSlidingExpiration);
				response.Write(collectionId);
			}
			else if (request["id"]!=null) //&& cache[request["id"]]!=null)
			{
				CheckCors(request, response);
				response.ContentType = "text/csv";
				response.Headers.Add("Content-Disposition", "attachment; filename=\"table.csv\"");
				var collection = cache[request["id"]] as Dictionary<string, string>;
				var columns = collection["columns"];
				var vessels = collection["vessels"];
				
				using (var conn = new NpgsqlConnection(""))
				{
					string sQL = @"SELECT parametr.name pname, value.value pvalue
FROM instance
JOIN ( 
	SELECT instance.object_id
	FROM parametr
	JOIN instance ON parametr.id = instance.parametr_id
	JOIN value ON instance.id = value.instance_id AND instance.object_id = value.object_id
	JOIN source ON instance.source_id = source.id AND value.date_end IS NULL
	WHERE source.name='IHS Markit' AND parametr.name='LRIMOShipNo' AND value.value=ANY(regexp_split_to_array(:vessels,' *, *'))
) vessels ON vessels.object_id=instance.object_id
JOIN parametr ON parametr.id = instance.parametr_id
JOIN value ON instance.id = value.instance_id AND instance.object_id = value.object_id
JOIN source ON instance.source_id = source.id AND value.date_end IS NULL
WHERE source.name='IHS Markit' AND parametr.name=ANY(regexp_split_to_array(:columns,' *, *'))
ORDER BY instance.object_id,parametr.id";

					var firstColumn = "";
					var firstRow = new List<string>();
					using (var command = new NpgsqlCommand(sQL, conn))
					{
						command.Parameters.AddWithValue("vessels", vessels);
						command.Parameters.AddWithValue("columns", columns);
						conn.Open();
						var rdr = command.ExecuteReader();
						var gotRecs = rdr.Read();
						while (gotRecs)
						{
							var column = rdr["pname"].ToString();
							if (firstColumn == "")
								firstColumn = column; 
							else if (firstColumn==column)
								break;						
							else
								response.Write(";");
							response.Write(rdr["pname"].ToString());
							firstRow.Add(rdr["pvalue"].ToString());
							gotRecs = rdr.Read();
						}
						response.Write("\n");
						response.Write(firstRow[0]);
						for(var i=1; i<firstRow.Count; ++i)
							response.Write(";" + firstRow[i]);
						response.Write("\n");
						if (gotRecs)
							response.Write(rdr["pvalue"].ToString());
						while (rdr.Read())
						{
							var column = rdr["pname"].ToString();
							if (firstColumn==column)
								response.Write("\n");
							else
								response.Write(";");
							response.Write(rdr["pvalue"].ToString());	
						}
						
						rdr.Close();
						conn.Close();
					}
				}	
				
				cache.Remove(request["id"]);
			}
			else
				throw new Exception("Invalid request");
		}
		catch(Exception e)
		{
			CheckCors(request, response);
			response.Write("ERROR: " + e.Message);
		}
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }
}
