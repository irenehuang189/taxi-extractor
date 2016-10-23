/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package taxi.gps.parser;

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
public class TaxiGpsParser {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws IOException {
        String csv_file = "/home/nithoalif/Downloads/IF4041/sample.csv";
        String line = "";
        String delimiter = ",";
        
        /* Mapping Taxi <-> GPS Data */
        BufferedReader br = new BufferedReader(new FileReader("/home/nithoalif/Downloads/IF4041/Data Warehouse/gps_map.csv"));
        HashMap<String, String> gps_map = new HashMap<String, String>();
        while ((line = br.readLine()) != null) {
            String str[] = line.split(",");
            gps_map.put(str[1].toLowerCase(), str[0].toLowerCase());
        }
        
        
        /* Match GPS Data with  */
        FileWriter fw = new FileWriter("/home/nithoalif/Downloads/IF4041/Data Warehouse/gps_data.csv", true);
        BufferedWriter bw = new BufferedWriter(fw);
        PrintWriter out = new PrintWriter(bw);
        
        try (Stream<Path> paths = Files.walk(Paths.get("/home/nithoalif/Downloads/IF4041/Data Warehouse/GPS"))) {
            paths.forEach(file_path -> {
                if (Files.isRegularFile(file_path)) {
                    System.out.println("Parsing : " + file_path.getFileName());
                    try {
                        String line2 = "";
                        BufferedReader br2 = new BufferedReader(new FileReader(file_path.toString()));
                        while ((line2 = br2.readLine()) != null) {
                            String data = ""; 
                            String str2[] = line2.split(",");
                            String latitude = str2[5].replaceAll("\\s+", "");
                            float f_latitude = Float.parseFloat(latitude);
                            String longitude = str2[4].replaceAll("\\s+", "");
                            float f_longitude = Float.parseFloat(longitude);
                            String time = str2[3];
                            
                            String gps_id = str2[1].replaceAll("\\s+","");
                            String taxi_id = "";
                            if (gps_map.containsKey(gps_id.toLowerCase()) && f_latitude != 0 && f_longitude != 0) {
                                taxi_id = gps_map.get(gps_id.toLowerCase());
                                data = taxi_id + "," + time + "," + latitude + "," + longitude;
                                out.println(data);                       
                            }
                        }
                        br2.close();                        
                    } catch (Exception ex) {
                        Logger.getLogger(TaxiGpsParser.class.getName()).log(Level.SEVERE, null, ex);
                    }
                }
            });
        }
        br.close();
        out.close();
        bw.close();
        fw.close();
    }
}
