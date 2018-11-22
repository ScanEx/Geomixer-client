<%@ WebHandler Language="C#" Class="Actual" %>
using System;
using System.Web;
using System.Net;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Linq;

class Prip
{
    public string title { get; set; }
    public string type { get; set; }
    public string objects { get; set; }
    public string maps { get; set; }
    public string books { get; set; }
    public string n { get; set; }
    public string year { get; set; }
    List<string> _lines = new List<string>();
    public List<string> lines { get{return _lines;} }
}

interface IParser
{
    List<Prip> Parse(string html);
}

class Parser1 : IParser
{
    public HttpResponse Response { get; set; }
    public List<Prip> Parse(string html) 
    {
        var s = "";
        var area = "";
        var prips = new List<Prip>();
        foreach (Match m in Regex.Matches(html, @"(ПРИП\s+\S+)\s+(\d+)/(\d+)[\s\S]+?(КАРТА[\s\d]+|КАРТЫ[\s\d]+)?(КНИГА[\s\d]+)?(\D+?)<pre>([\s\S]+?)</pre>", RegexOptions.IgnoreCase))
        {
            var prip = new Prip() { type = m.Groups[1].Value, n = m.Groups[2].Value, year = m.Groups[3].Value };
            //Response.Write("[" + m.Groups[1].Value + "]<br>");
            //Response.Write("[" + m.Groups[2].Value + "]<br>");
            //Response.Write("[" + m.Groups[3].Value + "]<br>");
            s = m.Groups[4].Value;
            prip.maps = Regex.Replace(s, @"[^А-Я\d]+$", "");
            //Response.Write("[" + Regex.Replace(s, @"[^А-Я\d]+$", "") + "]<br>");
            s = m.Groups[5].Value;
            prip.books = Regex.Replace(s, @"[^А-Я\d]+$", "");
            //Response.Write("[" + Regex.Replace(s, @"[^А-Я\d]+$", "") + "]<br>");
            area = m.Groups[6].Value;
            area = Regex.Replace(Regex.Replace(area, @"[^А-Я ]", ""), @"\s+$", "");
            //Response.Write("[" + Regex.Replace(area, @"[^А-Я ]", "!") + "]<br>");
            prip.title = String.Format("{0} {1}/{2} {3}{4}", prip.type, prip.n, prip.year, prip.maps + (prip.books != "" ? " " : ""), prip.books);

            s = m.Groups[7].Value;
            s = Regex.Replace(s, @"^[\s\S]*ПРИП[А-Я ]+"+prip.n+@"\s+(КАРТА[^А-Я]+|КАРТЫ[^А-Я]+)?(КНИГА[^А-Я]+)?", "");
            if (area != "")
            {
                s = Regex.Replace(s, @"^[\s\S]*?" + area, area);
                if (!s.StartsWith(area))
                    s = area + Environment.NewLine + s;
            }
            s = Regex.Replace(s, @"=[\s\S]+$", Environment.NewLine);
            foreach(var l in s.Split(new string[]{"\r\n"}, StringSplitOptions.RemoveEmptyEntries))
                prip.lines.Add(Regex.Replace(l, @"([\d\.,]+-[\d\.]+[-\d\.,]*(N|С) [\d\.,]+-[\d\.]+[-\d\.,]*(E|В|W|З)*)", "<span class='coordinate'>$1</span>", RegexOptions.IgnoreCase));
                               
            //Response.Write("["+Regex.Replace(s, @"\r\n", "<br>") + "]<br>");
            //Response.Write("<br><br>");
            prips.Add(prip);
        }
        return prips;
    }
}
class Parser2 : IParser
{
    public HttpResponse Response { get; set; }
    public List<Prip> Parse(string html)
    {
        var s = "";
        var prips = new List<Prip>();
        foreach (Match m in Regex.Matches(html, @"<p>(?:[^А-Я](?!<p>))+?(ПРИП\s+[А-Я]+)\D+(\d+)/(\d+)[^А-Я]+?(К(?:[\s\S]+?(?=К|</p>)))?(К(?:[\s\S]+?(?=</p>)))?</p>([\s\S]+?(?:НННН|HHHH)[\s\S]*?</p>)", RegexOptions.IgnoreCase))//+?[\s\S]+?(КАРТА[\s\d]+|КАРТЫ[\s\d]+)?(КНИГА[\s\d]+)?(\D+?)<pre>([\s\S]+?)</pre>"))
        {            
            //Response.Write("[" + Regex.Replace(m.Groups[1].Value, @"<[^<>]+>", "") + "]<br>");
            //Response.Write("[" + Regex.Replace(m.Groups[2].Value, @"<[^<>]+>", "") + "]<br>");
            //Response.Write("[" + Regex.Replace(m.Groups[3].Value, @"<[^<>]+>", "") + "]<br>");
            var prip = new Prip() { 
                type = Regex.Replace(m.Groups[1].Value, @"<[^<>]+>", "").Replace("&nbsp;", " "),
                n = Regex.Replace(m.Groups[2].Value, @"<[^<>]+>", "").Replace("&nbsp;", " "),
                year = Regex.Replace(m.Groups[3].Value, @"<[^<>]+>", "").Replace("&nbsp;", " ")
            };
            //Response.Write("[" + Regex.Replace(m.Groups[4].Value, @"<[^<>]+>", "") + "]<br>");
            s = Regex.Replace(m.Groups[4].Value, @"<[^<>]+>", "").Replace("&nbsp;", " ");
            prip.maps = Regex.Replace(s, @"\D+$", "");
            //Response.Write("[" + Regex.Replace(m.Groups[5].Value, @"<[^<>]+>", "") + "]<br>");
            s = Regex.Replace(m.Groups[5].Value, @"<[^<>]+>", "").Replace("&nbsp;", " ");
            prip.books = Regex.Replace(s, @"\D+$", "");
            //Response.Write("[" + m.Groups[6].Value.Replace("<", "&lt;").Replace(">", "&gt;") + "]<br>");
            prip.title = String.Format("{0} {1}/{2} {3}{4}", prip.type, prip.n, prip.year, prip.maps + (prip.books != "" ? " " : ""), prip.books);

            foreach (Match mm in Regex.Matches(m.Groups[6].Value, @"<p>([\s\S]+?)</p>"))
                //Response.Write("[" + Regex.Replace(mm.Groups[1].Value, @"<[^<>]+>", "") + "]<br>");
                prip.lines.Add(Regex.Replace(Regex.Replace(mm.Groups[1].Value, @"<[^<>]+>", ""), @"([\d\.,]+-[\d\.]+[-\d\.,]*(N|С) [\d\.,]+-[\d\.]+[-\d\.,]*(E|В|W|З)*)", "<span class='coordinate'>$1</span>", RegexOptions.IgnoreCase));
                //prip.lines.Add(Regex.Replace(mm.Groups[1].Value, @"<[^<>]+>", "").Replace("&nbsp;", " "));             
            //Response.Write("<br>");
            prips.Add(prip);
        }
        //Response.Write("<br>");
        return prips;
    }
}

static class HttpResponseExt
{
    public static void WriteJson(this HttpResponse response, object obj)
    {
        response.ContentEncoding = Encoding.UTF8;
        response.ContentType = "application/json";
        response.Write(Newtonsoft.Json.JsonConvert.SerializeObject(obj));
    }
}

public class Actual : IHttpAsyncHandler
{
    HttpWebRequest _httpReq;
    HttpContext _context;
    string _zone = "";


    IParser CreateParser() 
    {
        if (_zone == "murm" || _zone == "arkh")
            return new Parser1() { Response = _context.Response };
        if (_zone == "west" || _zone == "east")
            return new Parser2() { Response = _context.Response };
        return null;
    }

    class EmergencyExit : IAsyncResult
    {
        public bool IsCompleted { get { return true; } }
        public bool CompletedSynchronously { get { return true; } }
        public System.Threading.WaitHandle AsyncWaitHandle { get { return new System.Threading.ManualResetEvent(true); } }

        public Object AsyncState { get; set; }
    }

    
    public IAsyncResult BeginProcessRequest(HttpContext context, AsyncCallback cb, object extraData)
    {
        _context = context;
        var url = "";
        _zone = context.Request["zone"];
        try
        {
            switch (_zone)
            {
                case "west":
                    url = String.Format("http://www.nsra.ru/ru/navigatsionnaya_i_gidrometinformatsiya/{0}.html", "cwm_west");
                    break;
                case "east":
                    url = String.Format("http://www.nsra.ru/ru/navigatsionnaya_i_gidrometinformatsiya/{0}.html", "cwm_east");
                    break;
                case "arkh":
                    url = "http://www.mapm.ru/PripAr";
                    break;
                case "murm":
                    url = "http://www.mapm.ru/Prip";
                    break;
                case "failed":
                    url = "http://failed";
                    break;
                default:
                    break;
            }
            _httpReq = (HttpWebRequest)HttpWebRequest.Create(url);
            return _httpReq.BeginGetResponse(cb, extraData);
        }
        catch (Exception ex)
        {
            return  new EmergencyExit() { AsyncState = ex };
        }
    }

    public void EndProcessRequest(IAsyncResult result)
    {
        var response = _context.Response;
        if (result is EmergencyExit && result.CompletedSynchronously)
        {
            response.WriteJson(new { Status = "error", ErrorInfo = result.AsyncState }); //, State = result
            return;
        }
        
        try
        {
            var httpResp = _httpReq.EndGetResponse(result);//(HttpWebResponse)state.Request.EndGetResponse(result);

            var parser = CreateParser();
            var prips = new List<Prip>();
            using (var sr = new StreamReader(httpResp.GetResponseStream(), Encoding.UTF8))
            {
                var responseHtml = sr.ReadToEnd();
                prips = parser.Parse(responseHtml);
            }
            response.WriteJson(new { Status="ok", Result = prips });//, State = result
        }
        catch (Exception ex)
        {
            response.WriteJson(new { Status = "error", ErrorInfo = ex }); //, State = result
        }
    }

    public bool IsReusable
    {
        get { return false; }
    }

    public void ProcessRequest(HttpContext context)
    {
        throw new NotImplementedException();
    }
}
