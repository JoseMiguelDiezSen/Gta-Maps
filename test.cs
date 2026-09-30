using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Collections.Generic;

public class MapPosition { public float x { get; set; } public float y { get; set; } public float z { get; set; } }
public class MapBadge { public string icon { get; set; } public string color { get; set; } public string symbol { get; set; } }
public class LocationItem {
    public string id { get; set; }
    public string name { get; set; }
    public string category { get; set; }
    public string categoryLabel { get; set; }
    public string gameMode { get; set; }
    public string owner { get; set; }
    [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
    public long price { get; set; }
    public string priceFormatted { get; set; }
    public string imageUrl { get; set; }
    public string zone { get; set; }
    public string description { get; set; }
    public List<string> features { get; set; }
    public string income { get; set; }
    public MapPosition position { get; set; }
    public MapBadge badge { get; set; }
}
class Program {
    static void Main() {
        var json = File.ReadAllText(""GTAAPP.Server/wwwroot/data/gta5/online/es/properties.json"");
        var opt = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        try {
            var items = JsonSerializer.Deserialize<List<LocationItem>>(json, opt);
            Console.WriteLine(""Success: "" + items.Count);
        } catch(Exception ex) {
            Console.WriteLine(""Error: "" + ex.Message);
        }
    }
}
