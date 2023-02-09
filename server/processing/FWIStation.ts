import { Station } from "./Station";

enum EffeciveDayLength {
    January = 6.5,
    February = 7.5,
    March = 9.0,
    April = 12.8,
    May = 13.9,
    June = 13.9,
    July = 12.4,
    August = 10.9,
    September = 9.4,
    October = 8.0,
    November = 7.0,
    December = 6.0,
}

class FWIStation extends Station{
    private currentFWI: number;
    private currentFFMC: number;
    private currentDMC: number;
    private currentDC: number;
    private currentISI: number;

    private previousFFMC: number;
    private effectiveDayLength: number;

    constructor(name: string){
        super(name);
        this.effectiveDayLength = EffeciveDayLength.February;
    }

    get index(){
        return this.currentFWI;
    }

    // Fine Fuel Moisture Code
    private calculateFFMC(): FWIStation {
        let prevMT = 147.2 * (101 - this.previousFFMC) / (59.5 + this.previousFFMC);
        
        if (this._precipitation > 0.5) {
          let pf = this._precipitation - 0.5;
          let mrt = prevMT + (42.5 * pf * Math.exp((-100) / (251 - prevMT)) * (1 - Math.exp(-6.93 / pf)));
          
          if (prevMT > 150) {
            mrt += 0.0015 * Math.pow(prevMT - 150, 2) * Math.pow(pf, 0.5);
          }
          if (mrt > 250) {
            mrt = 250;
          }
          prevMT = mrt;
        }
        
        const ed = 0.942 * Math.pow(this.relativeHumidity, 0.679) + 11 * Math.exp((this.relativeHumidity - 100) / 10) + 0.18 * (21.1 - this.temperature) * (1 - Math.exp(-0.115 * this.relativeHumidity));
        
        let mt: number;
        if (ed < prevMT) {
          let ko = 0.424 * (1 - Math.pow(this.relativeHumidity / 100, 1.7)) + 0.0694 * this.windSpeed * (1 - Math.pow(this.relativeHumidity / 100, 8));
          let kd = ko * 0.581 * Math.exp(0.0365 * this.temperature);
          mt = ed + (prevMT - ed) * Math.pow(10, -kd);
        } 
        else{
          let ew = 0.618 * Math.pow(this.relativeHumidity, 0.753) + 10 * Math.exp((this.relativeHumidity - 100) / 10) + 0.18 * (21.1 - this.temperature) * (1 - Math.exp(-0.115 * this.relativeHumidity));
          if (ew > prevMT) {
            let k1 = 0.424 * (1 - Math.pow((100 - this.relativeHumidity) / 100, 1.7)) + 0.0694 * (1 - Math.pow((100 - this.relativeHumidity) / 100, 8));
            let kw = k1 * 0.581 * Math.exp(0.0365 * this.temperature);
            mt = ew - (ew - prevMT) * Math.pow(10, -kw);
          } else {
            mt = prevMT;
          }
        }
        
        this.currentFFMC = 59.5 * ((250 - mt) / (147.2 + mt));
        return this;
    }

    // Duff Moisture Code
    private calculateDMC(): FWIStation{
        let L_e: number = this.effectiveDayLength;

        var tmp: number;
        if(this.temperature < -1.1){
            tmp = -1.1;
        }
        else{
            tmp = this.temperature;
        }

        let K = 1.894 * (tmp + 1.1) * (100- this.relativeHumidity) * L_e * 0.000001;
        
        if(this.precipitation < 1.5){
            this.currentDMC = this.currentDMC + 100*K;
        }
        else{
            let P_e: number = 0.92 * this.precipitation - 1.27;
            let prev_M : number= 20 + Math.exp(5.6348 - (this.currentDMC)/43.43);

            let b: number;
            if(this.currentDMC <= 33){
                b = 100 / (0.5 + 0.3 * this.currentDMC);
            }
            else if(this.currentDMC <= 65){
                b = 14 - 1.3 * Math.log(this.currentDMC);
            }
            else{
                b = 6.2 * Math.log(this.currentDMC) - 17.2;
            }

            let M_r_t: number = prev_M + ((1000*P_e)/(48.77 + b*P_e));
            let DMC_r_t: number = Math.max(244.72 - 43.43 * Math.log(M_r_t - 20), 0);

            this.currentDMC = DMC_r_t + 100*K;
        }

        return this;
    }
    

}

export { FWIStation };