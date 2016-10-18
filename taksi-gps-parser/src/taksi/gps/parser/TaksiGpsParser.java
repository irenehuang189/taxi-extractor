/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package taksi.gps.parser;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Stream;

/**
 *
 * @author nithoalif
 */
public class TaksiGpsParser {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws IOException {
        String csv_file = "/home/nithoalif/Downloads/IF4041/sample.csv";
        String line = "";
        String delimiter = ",";
        
        /* Mapping Taxi <-> GPS Data */
        BufferedReader br = new BufferedReader(new FileReader("/home/nithoalif/Downloads/IF4041/gps_map.csv"));
        HashMap<String, String> gps_map = new HashMap<String, String>();
        while ((line = br.readLine()) != null) {
            String str[] = line.split(",");
            gps_map.put(str[1].toLowerCase(), str[0].toLowerCase());
        }
        
        
        /* Match GPS Data with  */
        FileWriter fw = new FileWriter("/home/nithoalif/Downloads/IF4041/gps_data.csv", true);
        BufferedWriter bw = new BufferedWriter(fw);
        PrintWriter out = new PrintWriter(bw);
        
        try (Stream<Path> paths = Files.walk(Paths.get("/home/nithoalif/Downloads/IF4041/to_be_parsed"))) {
            paths.forEach(file_path -> {
                if (Files.isRegularFile(file_path)) {
                    System.out.println("Parsing : " + file_path.getFileName());
                    try {
                        String line2 = "";
                        String line3 = "";
                        BufferedReader br2 = new BufferedReader(new FileReader(file_path.toString()));
                        while ((line2 = br2.readLine()) != null && (line3 = br2.readLine()) != null) {
                            String data = ""; 
                            String str2[] = line2.split(",");
                            String str3[] = line3.split(",");
                            String start_latitude = str2[5].replaceAll("\\s+", "");
                            String start_longitude = str2[4].replaceAll("\\s+", "");
                            String start_datetime = str2[3];
                            String stop_latitude = str3[5].replaceAll("\\s+", "");
                            String stop_longitude = str3[4].replaceAll("\\s+", "");
                            String stop_datetime = str3[3];
                            
                            String gps_id = str2[1].replaceAll("\\s+","");
                            String taxi_id = "";
                            if (gps_map.containsKey(gps_id.toLowerCase())) {
                                taxi_id = gps_map.get(gps_id.toLowerCase());
                                data = taxi_id + "," + start_datetime + "," + start_latitude + "," + start_longitude + "," + stop_datetime + "," + stop_latitude + "," + stop_longitude;
                                out.println(data);                            
                            }                            
                            
                        }
                    } catch (Exception ex) {
                        Logger.getLogger(TaksiGpsParser.class.getName()).log(Level.SEVERE, null, ex);
                    }
                    
                }
            });
        }
    }
    
}
