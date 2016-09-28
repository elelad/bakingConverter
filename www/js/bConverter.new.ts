/// <reference path="../lib/jquery.d.ts" />
/// <reference path="../lib/jquerymobile.d.ts" />


//TODO update data in data files


interface String {
    startsWith(str: string): boolean;
}


//---------------- Listeners -----------------------------------
$(document).on("ready", function () {
    CN.clearResults();
    CN.setMeasureSystem();
    $('input[type=radio][name=mSystem]').change(function () {// if user changed measure system
        CN.oldMeasureSystem = CN.getMeasureSystem();
        CN.setMeasureSystem(this.value);
        CN.clearResults();
        CN.getData(); //if measure system changed then get new data
        //$("#pSystemMeasureBtn").html(CN.getMeasureSystem());
    });// if user changed measure system in setting page
    $("#gUnitList,#gToList").change(function () {// if user changed measure system in weight page
        $("#gResult").hide();
    });// if user changed measure system in weight page
    $("#mUnitList,#mToList").change(function () {// if user changed measure system in volume page
        $("#mResult").hide();
    });// if user changed measure system  in volume page
    $("#locationYesBtn").on("click", function () {
        $("#locationPopup").popup("close");
        $("#loading").popup("open");
        CN.getCountry();
    }); //location popup ===not active===
    $("#locationNoBtn").on("click", function () {
        $("#locationPopup").popup("close");
        $("#loading").popup("open");
        CN.setMeasureSystem();
        CN.getData();
    });//location popup ===not active===
    $("#gMeasure, #mMeasure, #tDegree").on("keypress", function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) { //Enter keycode
            e.preventDefault();
            CN.validateInputNum(this);
            this.blur(); //close keyboard in mobile
        }
    });//show result if user pressed enter at input
    //window.location = "index.html";
    //CN.getCountry();
    $(function(){
        $("#bMenu").enhanceWithin().popup();
    });
});
$(document).on("pagecontainerbeforechange", function (event, ui) {
    CN.activePage = ui.toPage[0].id;
    switch (CN.activePage) {
        case "pWeight":
            break;
        case "pVolune":
            break;
        case "pTemperature":
            break;
        case "home":
            break;
        case "pSetting":
            $("#r" + CN.getMeasureSystem()).prop('checked', true).checkboxradio("refresh");
            CN.dataToSettingPage();
            $("#getCountryBtn").on("click", CN.getCountry);
            //$("#systemFildset").trigger("create");
            break
    }
});
$(document).on("pagecontainershow", function (event, ui) {
    CN.activePage = ui.toPage[0].id;
    switch (CN.activePage) {
        case "pWeight":
            $("#gMeasure").focus();
            break;
        case "pVolume":
            $("#mMeasure").focus();
            break;
        case "pTemperature":
            $("#tDegree").focus();
            break;
        case "home":
            break;
        case "pSetting":
            break;
    }
    $("#loading").enhanceWithin().popup({
        overlayTheme: "b",
        positionTo: "window",
        transition: "pop",
        history: false
    }); //loading popup
    if ((ui.toPage[0].id == "home") && (ui.prevPage.length == 0)) { // if first time that home page load
        //var popupPos = $("#popupPos");
        $("#locationPopup").popup({
            positionTo: "#popupPos",
            overlayTheme: "b",
            transition: "pop",
            history: false
        });//.popup("open");
        CN.setMeasureSystem();
        CN.getData();
    }
});

//--------------Const Var's & methods-----------------------------
class CN {
    static dataReady: boolean = false;
    static dataVersion = "V0.7.0 D08092016";
    static activePage: string = "home"; // to store active page
    private static allIng; //initialize new array for ingredients
    static getAllIng() {
        return this.allIng;
    } //get private allAll
    private static bConvertData = "data/dataEU.json"; //address for data file in use
    private static bTransition:string =  "slide";

    //private static query: string = "";

    //---------find country with google maps------------
    private static apiKey: string = "AIzaSyDzyEu__JkZf-ao55rgd6BtLxhHk4493b4"; // api  key for google maps
    private static geocodingRequest(lonlat: string): string {
        return "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lonlat + "&key=" + CN.apiKey;
    } // address builder for google maps
    private static userCountryLong: string = "";
    private static userCountryShort: string = "";
    private static getAndroidLocationP(): void {
        try {
            console.log("request to android");
            Android.requestLocation();
        } catch (e) {
            console.log(e);
        }
        finally {
        }
    }//display android location permeation request for marshmallow
    static getCountry(fAndroid?:boolean): void {
        console.log("getCountry Activated");
        console.log("fAndroid: " + fAndroid + "");
        if (fAndroid != true) { // if calling came from android then no need to request permissions again
            CN.getAndroidLocationP();
        }
        CN.oldMeasureSystem = CN.getMeasureSystem();
        function geoSuccess(pos: Position): void {
            $("#loading").popup("open");
            var lat = pos.coords.latitude;
            var lon = pos.coords.longitude;
            var lonlat: string = lat + "," + lon;
            console.log(CN.geocodingRequest(lonlat));
            $.getJSON(CN.geocodingRequest(lonlat), function (data) {
                var locationData: any = data;
                var result: any[] = data.results[0].address_components;
                result.forEach(item=> {
                    if (item.types[0] == "country") {
                        console.log("long: " + item.long_name + " short: " + item.short_name);
                        CN.userCountryLong = item.long_name;
                        CN.userCountryShort = item.short_name;
                        CN.setMeasureSystem(CN.userCountryShort);
                        if (CN.activePage == "pSetting") {
                            $("input[type=radio][name=mSystem]").prop('checked', false).checkboxradio("refresh");
                            $("#r" + CN.getMeasureSystem()).prop('checked', true).checkboxradio("refresh");
                        }
                        CN.getData();
                    }
                })
            }).fail(function () {
                CN.errorLoadingData();
            })
        } // if navigator geoLocation request success
        function geoError(error) {
            console.log(error);
            try {
                Android.showToast("Allow location and try again");
            } catch (e) {
                console.log(e);
            }
            finally {
            }
            CN.errorLoadingData();
        } // if navigator geoLocation request error
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError); // send the request
    }//get countryfrom user and get the relevant data

    //---------measure system----------------
    private static measureSystem: string = ""; // var for measure System
    static oldMeasureSystem = "";
    static setMeasureSystem(mSystem?: string): string {
        if (mSystem) { // if prefered measure System passed to the function
            switch (mSystem) {
                case "IL":
                case "US":
                case "UK":
                case "AU":
                case "CA":
                case "EU":
                    CN.measureSystem = mSystem;
                    break;
                case "":
                    break;
                default:
                    CN.measureSystem = "EU";
                    console.log(mSystem);
            }
            localStorage.setItem("bConverterMeasureSystem", CN.measureSystem);
        } else { // if prefered measure System didnt passed to the function
            CN.measureSystem = (localStorage.getItem("bConverterMeasureSystem")) ?
                localStorage.getItem("bConverterMeasureSystem") : "EU";
            // check if measure system exist in local storage if not set default
            localStorage.setItem("bConverterMeasureSystem", CN.measureSystem); //update local storage
        }
        CN.bConvertData = "data/data" + CN.measureSystem + ".json"; // update data file address
        console.log("CN.measureSystem: " + CN.measureSystem);
        $(".pSystemMeasureBtn").html(CN.measureSystem); // update indicator
        return CN.measureSystem;
    } // setter for measure System
    static getMeasureSystem() {
        //CN.setMeasureSystem();
        return CN.measureSystem;
    } //measure system is private

    //---------- data handling ------------
    private static ingRequest: XMLHttpRequest = new XMLHttpRequest(); //xhr to get ingredient from server
    static dataToSettingPage() {
        console.log("data to setting page");
        var key = "bConverterData" + CN.measureSystem;
        var data: string = localStorage.getItem(key);
        let obResponse: Data = JSON.parse(data); //parse response
        var volume = new VolumeIng(obResponse.volume.ml[0].iName, obResponse.volume.ml[0].iCup, obResponse.volume.ml[0].iSpoon,
            obResponse.volume.ml[0].iTeaspoon);
        $("#settingMeasure").html(volume.print());
    } // change data in setting page base on measure system
    static errorLoadingData(): void {
        console.log("error loading data ");
        CN.setMeasureSystem(CN.oldMeasureSystem);//go back to previous
        $("#errorMsg").html("Can't Load Data").fadeIn(1000).delay(3000).fadeOut(1000);//display error msg
        $("[name=mSystem]").prop('checked', false).checkboxradio("refresh");
        $("#r" + CN.getMeasureSystem()).prop('checked', true).checkboxradio("refresh"); //update radioCheckboxes
        CN.dataToSettingPage();
        CN.loadingOff();
    } // show msg if cant get data
    static dataToArray(className: string): void {
        var key = "bConverterData" + CN.measureSystem;
        var data: string = localStorage.getItem(key);
        var url: string = "";
        let obResponse: Data = JSON.parse(data); //parse response
        switch (className) {
            case "WeightIng":
                CN.allIng = new AllIng<WeightIng>();
                obResponse.weight.factors.forEach(item => CN.allIng.pushFactors(new Factor(item.fName, item.fValue)));
                url = "#pWeight";
                for (let i: number = 0; i < obResponse.weight.gram.length; i++) { // put data in array
                    CN.allIng.pushIngredient(new WeightIng(obResponse.weight.gram[i].iName, obResponse.weight.gram[i].iCup,
                        obResponse.weight.gram[i].iSpoon, obResponse.weight.gram[i].iTeaspoon));
                }
                break;
            case ("VolumeIng"):
                CN.allIng = new AllIng<VolumeIng>();
                obResponse.volume.factors.forEach(item => CN.allIng.pushFactors(new Factor(item.fName, item.fValue)));
                url = "#pVolume";
                CN.allIng.pushIngredient(new VolumeIng(obResponse.volume.ml[0].iName, obResponse.volume.ml[0].iCup,
                    obResponse.volume.ml[0].iSpoon, obResponse.volume.ml[0].iTeaspoon));
                break;
            case ("Temperature"):
                CN.allIng = new AllIng<Temperature>();
                url = "#pTemperature";
                for (let i: number = 0; i < obResponse.temperature.length; i++) { // put data in array
                    CN.allIng.pushIngredient(new Temperature(obResponse.temperature[i].iName));
                }
                break;
        }
        //CN.allIng.printIngArray();
        CN.putDataInSelectList(className);// put ingredients names in the select list
        $.mobile.changePage(url, {
            dataUrl: "h",
            showLoadMsg: false,
            transition: CN.bTransition
        });// go to the page
    }//get json string, parse it, put in array, display to user
    static getData(className?: string): void {
        setTimeout(function () {
            $("#loading").enhanceWithin().popup({
                overlayTheme: "b",
                positionTo: "window",
                transition: "pop",
                history: false
            }).popup("open");
        }, 10);
        $("#errorMsg").hide();
        //$("#loading").popup("open");
        var tempResponse: string;
        var key = "bConverterData" + CN.measureSystem;
        var localstoregeVersion = localStorage.getItem("bConverterDataVersion");
        var page: string = CN.activePage;
        console.log(page);
        if (localstoregeVersion != CN.dataVersion) {
            for (var i = (localStorage.length); i >= 0; i--) {
                var keyToDelete: String = String(localStorage.key(i));
                if (keyToDelete.startsWith("bConverterData")) {
                    localStorage.removeItem(keyToDelete + "");
                }
            }
        }
        if (localStorage.getItem(key) && localstoregeVersion == CN.dataVersion) { //if there is local data get it
            tempResponse = localStorage.getItem(key); //get response
            if (CN.activePage == "pSetting") {
                CN.dataToSettingPage();
            }
            console.log("data from localstorage");
            CN.loadingOff();
            $("#pSystemMeasureBtn").html(CN.getMeasureSystem());
        } else { //if there isn't updated local data get it from the server
            CN.ingRequest.abort();
            CN.ingRequest.open("GET", CN.bConvertData, true);
            CN.ingRequest.onreadystatechange = function () {
                if (CN.ingRequest.readyState == 4 && CN.ingRequest.status == 200) {
                    tempResponse = CN.ingRequest.responseText; //get response
                    localStorage.setItem(key, tempResponse);
                    localStorage.setItem("bConverterDataVersion", CN.dataVersion);
                    CN.dataReady = true;
                    //console.log(JSON.parse(tempResponse));
                    if (CN.activePage == "pSetting") {
                        CN.dataToSettingPage();
                    }
                    console.log("data from server");
                    CN.loadingOff();
                    $("#pSystemMeasureBtn").html(CN.getMeasureSystem());
                }
                if (CN.ingRequest.readyState == 4 && CN.ingRequest.status != 200) {
                    CN.errorLoadingData();
                }
            };
            this.ingRequest.send(null);
        }
    } //generic method to get data from server or localstorage and put it in the ingredients array

    //--------DOM, input, result -------------
    static putDataInSelectList(className: string): void {
        var listId: string = "";
        var unitListId: string = "";
        switch (className) {
            case "WeightIng":
                listId = "gIngList";
                unitListId = "gUnitList";
                break;
            case "VolumeIng":
                listId = "mIngList";
                unitListId = "mUnitList";
                break;
            case "Temperature":
                listId = "tIngList";
                break;
        }
        var select: HTMLSelectElement = <HTMLSelectElement>document.getElementById(listId);
        $(select).empty();
        select.length = 0;
        for (let i: number = 0; i < CN.allIng.getIngredients().length; i++) {
            let opt = document.createElement("option"); //create option
            opt.value = i.toString(); // put value in option
            opt.text = CN.allIng.getIngredients()[i].ingName(); // put text in option
            //if (i == 0) {opt.setAttribute("selected", "true");}
            select.appendChild(opt); //put option in the list
        }
        $("#" + listId).selectmenu().selectmenu("refresh"); // refresh list to show the first ingridiante
        if (unitListId != "") {
            select = <HTMLSelectElement>document.getElementById(unitListId);
            select.length = 0;
            for (let i: number = 0; i < CN.allIng.getFactors().length; i++) {
                let opt = document.createElement("option"); //create option
                opt.value = i.toString(); // put value in option
                opt.text = CN.allIng.getFactors()[i].getName(); // put text in option
                //if (i == 0) {opt.setAttribute("selected", "true");}
                select.appendChild(opt); //put option in the list
            }
        }
        $("#" + unitListId).selectmenu().selectmenu('refresh');
        //select.value = "1";

    } // method to put options in select ingredients html list
    static validateInputNum(element: HTMLInputElement): boolean {
        var measure: number = parseInt($(element).val());
        var rgx: RegExp = /\d/;
        console.log("is:" + rgx.test(measure.toString()));
        var eId: string = $(element).attr("id")[0];
        console.log("id[0]:" + eId);
        if (rgx.test(measure.toString()) && measure != 0) {
            switch (eId) {
                case "g":
                    WeightIng.gramResultToScreen();
                    break;
                case "m":
                    VolumeIng.mlResultToScreen();
                    break;
                case "t":
                    Temperature.temperatureResultToScreen();
                    break;
            }
            return true;
        } else {
            console.log("pls enter a number");
            var currentBackground: string = $(element).parent().css("background-color"); //a.style.backgroundColor;
            $(element).parent().css("background-color", "rgba(255,0,0,0.7)");
            $(element).on("focus", function () {
                $(element).parent().css("background-color", currentBackground);
            });
            return false;
        }
    }//validate user input and pass if validated
    static loadingOff(): void {
        setTimeout(function () {
            $("#loading").popup("close");
        }, 1500)
    }
    static clearResults(): void {
        $("#gResult").hide();
        $("#mResult").hide();
        $("#tResult").hide();
        $("#gMeasure").val("");
        $("#mMeasure").val("");
        $("#tDegree").val("");
    }
    static goToSetting() {
        $.mobile.changePage("#pSetting", {
            dataUrl: "h",
            showLoadMsg: true,
            transition: CN.bTransition
        });// go to the page
    } // go to setting page
    static goToAbout() {
        $.mobile.changePage("#pAbout", {
            dataUrl: "h",
            showLoadMsg: true,
            transition: CN.bTransition
        });// go to the page
    } // go to setting page
    static convertTool(tool: string, result: number) {
        return (result > 1) ? tool + "s" : tool;
    }// get tool & result and return cups or cup
}// class for const variables and methods


//-----------interface for JSON parsing-------------------
interface dataFactor {
    fName: string;
    fValue: number;
}
interface Data {
    weight: {
        gram: DataIng[];
        factors: dataFactor[];
    }
    volume: {
        ml: DataIng[];
        factors: dataFactor[];
    }
    temperature: DataIng[];
}
interface DataIng {
    iName: string;
    iCup: number;
    iSpoon: number;
    iTeaspoon: number;
}


//------------Classes-----------------------------------
class AllIng<T extends Ing> {
    private aIngredients: T[] = []; //array for all ingredients for a kind
    private factors: Factor[] = [];

    pushFactors(factor: Factor): void {
        this.factors.push(factor);
    }//method to push factors to array
    pushIngredient(ing: T): void {
        this.aIngredients.push(ing);
    }//method to push ingredient to array
    printIngArray(): void {
        for (let i: number = 0; i < this.aIngredients.length; i++) {
            console.log(this.aIngredients[i].print());
        }
    }

    getIngredients(): T[] {
        return this.aIngredients;
    }

    getFactors(): Factor[] {
        return this.factors;
    }
} //generic class for array for ingredient for all child's of Ing

class Factor {
    constructor(private fName: string, private fValue: number) {
    }

    getName(): string {
        return this.fName;
    }

    getValue(): number {
        return this.fValue;
    }

    factorize(num: number): number {
        return num * this.fValue
    }

}

class Ing {
    constructor(private iName: string) {
    }

    ingName(): string {
        return this.iName;
    }

    print(): string {
        return "";
    }// for override

    convertResult(grams: number, tool: string, factor?: number): number {
        return -1;
    } // for override
} // class for one ingredient

class WeightIng extends Ing {
    static className = "WeightIng";
    private iToCup: number;
    private iToSpoon: number;
    private iToTeaspoon: number;

    constructor(iName: string, private iCupTo: number, private iSpoonTo: number, private iTeaspoonTo: number) {
        super(iName);
        this.iToCup = 1 / this.iCupTo;
        this.iToSpoon = 1 / this.iSpoonTo;
        this.iToTeaspoon = 1 / this.iTeaspoonTo;
    }

    print(): string {
        return super.print() + " CupToGram:" + this.iCupTo + " SpoonToGram:" + this.iSpoonTo + " TeaspoonToGram:" + this.iTeaspoonTo;
    }


    //@Override
    convertResult(grams: number, tool: string, factor: number): number {
        let result: number;
        switch (tool) {
            case "Cup":
                result = grams * this.iToCup;
                break;
            case "Spoon":
                result = grams * this.iToSpoon;
                break;
            case "Teaspoon":
                result = grams * this.iToTeaspoon;
                break;
        }
        result *= factor;
        return (result > 0) ? Math.round((result) * 10) / 10 : -1; //if no data to convert return -1
    }//convert and get result in number

    static gramResultToScreen(): void {
        let measure: number = parseFloat($("#gMeasure").val()); // get grams from user
        //let measureName: string = $("#gMeasureLabel").html(); //get measure label (garm or ml)
        let tool: string = $("#gToList").val(); //get tool from user
        let ingNumber: number = parseInt($("#gIngList").val()); //get ingredient from user
        let factorNumber = parseInt($("#gUnitList").val());
        let measureName: string = CN.getAllIng().getFactors()[factorNumber].getName();
        console.log(measureName);
        let factor = CN.getAllIng().getFactors()[factorNumber].getValue();
        console.log("measure: " + measure + " tool:" + tool);
        let result = CN.getAllIng().getIngredients()[ingNumber].convertResult(measure, tool, factor);
        if (result < 0) { //check if there is data
            $("#gResult").html("Can't convert to " + tool).show().css("display", "inline-block");
            /*$("#gResult").html("are you nuts?? " + measure + " " + measureName + " of " + CN.getAllIng().getIngredients()[ingNumber]                .ingName() + "??").show().css("display", "inline-block");*/
        } else {
            let toolToPrint = CN.convertTool(tool, result);
            $("#gResult").html("<p class='ingName'>" + CN.getAllIng().getIngredients()[ingNumber].ingName() + "</p>" + measure + " " + measureName + " = " + result + " " + toolToPrint).show().css("display", "inline-block"); // display result
        }
    } // method to calculate convert result and show it to the user - for gram only
} // class for gram convert ingredient

class VolumeIng extends Ing {
    static className = "VolumeIng";
    private iMlToCup: number;
    private iMlToSpoon: number;
    private iMlToTeaspoon: number;

    constructor(iName: string, private iCupToMl: number, private iSpoonToMl: number, private iTeaspoonToMl: number) {
        super(iName);
        this.iMlToCup = 1 / this.iCupToMl;
        this.iMlToSpoon = 1 / this.iSpoonToMl;
        this.iMlToTeaspoon = 1 / this.iTeaspoonToMl;
    }

    print(): string {
        return super.print() + "Cup = " + this.iCupToMl + "ml<br> Spoon = " + this.iSpoonToMl + "ml<br> Teaspoon = " + this.iTeaspoonToMl + "ml";
    }

    //@Override
    convertResult(grams: number, tool: string, factor: number): number {
        let result: number;
        switch (tool) {
            case "Cup":
                result = grams * this.iMlToCup;
                break;
            case "Spoon":
                result = grams * this.iMlToSpoon;
                break;
            case "Teaspoon":
                result = grams * this.iMlToTeaspoon;
                break;
        }
        result *= factor;
        return (result > 0) ? Math.round((result) * 10) / 10 : -1; //if no data to convert return -1
    }

    static mlResultToScreen(): void {
        let measure: number = parseFloat($("#mMeasure").val()); // get grams from user
        //let measureName: string = $("#mMeasureLabel").html(); //get measure label (garm or ml)
        let tool: string = $("#mToList").val(); //get tool from user
        let ingNumber: number = parseInt($("#mIngList").val()); //get ingredient from user
        console.log("measure: " + measure + " tool:" + tool);
        let factorNumber = parseInt($("#mUnitList").val());
        let measureName: string = CN.getAllIng().getFactors()[factorNumber].getName();
        console.log(measureName);
        console.log(measureName);
        let factor = CN.getAllIng().getFactors()[factorNumber].getValue();
        let result = CN.getAllIng().getIngredients()[ingNumber].convertResult(measure, tool, factor);
        if (result < 0) { //check if there is data
            $("#mResult").html("Can't convert to " + tool).show().css("display", "inline-block");
            /*.html("are you nuts?? " + measure + " " + measureName + " of " + CN.getAllIng().getIngredients()[ingNumber]                .ingName() + "??").show().css("display", "inline-block");*/
        } else {
            let toolToPrint = CN.convertTool(tool, result);
            $("#mResult").html(measure + " " + measureName + " = " + result + " " + toolToPrint).show()
                .css("display", "inline-block");// display result
            /*
             $("#mResult").html(measure + " " + measureName + " = " + CN.getAllIng().getIngredients()                   [ingNumber]                 .convertResult(measure, tool) + " " + tool).show().css("display", "inline-block"); // display result*/
        }
    } // method to calculate convert result and show it to the user - for ml only
} // class for gram convert ingredient

class Temperature extends Ing {
    constructor(iName: string) {
        super(iName);
    }

    //@Override
    convertResult(degree: number, scale: string): number {
        let result: number = 0;
        switch (this.ingName()) {
            case "Fahrenheit":
                result = Math.round((degree - 32) / 1.8);
                break;
            case "Celsius":
                result = Math.round((degree * 1.8) + 32);
                break;
        }
        return result;
    }

    static temperatureResultToScreen(): void {
        let degree: number = parseInt($("#tDegree").val()); // get degree from user
        let scaleNumber: number = parseInt($("#tIngList").val()); //get scale number from user
        console.log("degree: " + degree);
        let result = CN.getAllIng().getIngredients()[scaleNumber].convertResult(degree, null);
        switch (CN.getAllIng().getIngredients()[scaleNumber].ingName()) {
            case "Fahrenheit":
                $("#tResult").html(degree + "&#176 Fahrenheit = " + result + "&#176 Celsius").show().css("display", "inline-block");
                break;
            case "Celsius":
                $("#tResult").html("#tResult").html(degree + "&#176 Celsius = " + result + "&#176 Fahrenheit").show().css("display",
                    "inline-block");
                break;
        }
    }// method to calculate convert result and show it to the user - for temperature only

    static toggleCeFa(): void {
        //let selected: HTMLSelectElement = <HTMLSelectElement>document.getElementById("tIngList");
        let selectedStr: string = $("#tIngList").val();  //selected.value;
        switch (selectedStr) {
            case "0":
                //document.getElementById("tTo").innerHTML = "Celsius";
                $("#tTo").html("Celsius");
                break;
            case "1":
                //document.getElementById("tTo").innerHTML = "Fahrenheit";
                $("#tTo").html("Fahrenheit");
                break;
        }
        $("#tDegree").focus();
    }

}//class for all Temperature related methods



