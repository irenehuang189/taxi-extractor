/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package taxi.gps.preprocessor;

import java.io.BufferedReader;
import java.io.BufferedWriter;
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
public class TaxiGpsPreprocessor {

    /**
     * @param args the command line arguments
     */
    public static void main(String[] args) throws IOException {
        String csv_file = "/home/nithoalif/Downloads/IF4041/Data Warehouse/gps_data.csv";
        String out_file = "/home/nithoalif/Downloads/IF4041/Data Warehouse/gps_preprocessed_nullstartlocation.csv";
        String line = "";
        String delimiter = ",";
        int increment = 0;
        int line_num = 0;

        try{
            FileWriter fw = new FileWriter(out_file, true);
            BufferedWriter bw = new BufferedWriter(fw);
            PrintWriter out = new PrintWriter(bw);
            BufferedReader br = new BufferedReader(new FileReader(csv_file));
            while ((line = br.readLine()) != null) {
                line_num++;
                String data = "";
                String str[] = line.split(delimiter);
                String taxi_id = str[0];
                String start_datetime = str[1];
                float start_latitude = Float.parseFloat(str[2]);
                float start_longitude = Float.parseFloat(str[3]);
                String stop_datetime = str[4];
                float stop_latitude = Float.parseFloat(str[5]);
                float stop_longitude = Float.parseFloat(str[6]);

                /* Clean Start Latitude/Longitude = 0 */
                if (start_latitude != 0 && start_longitude != 0) {
                    data = taxi_id + "," + start_datetime + "," + start_latitude + "," + start_longitude + "," + stop_datetime + "," + stop_latitude + "," + stop_longitude;
                    out.println(data);
                    increment++;
                }
            }
            br.close();
            out.close();
            bw.close();
            fw.close();
            System.out.println(increment);
        } catch (Exception ex) {
            System.err.println(line_num);
            Logger.getLogger(TaxiGpsPreprocessor.class.getName()).log(Level.SEVERE, null, ex);
        }
    }
    
}
