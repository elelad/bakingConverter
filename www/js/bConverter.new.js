/// <reference path="../lib/jquery.d.ts" />
/// <reference path="../lib/jquerymobile.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
//---------------- Listeners -----------------------------------
$(document).on("ready", function () {
    CN.clearResults();
    CN.setMeasureSystem();
    $('input[type=radio][name=mSystem]').change(function () {
        CN.oldMeasureSystem = CN.getMeasureSystem();
        CN.setMeasureSystem(this.value);
        CN.clearResults();
        CN.getData(); //if measure system changed then get new data
        //$("#pSystemMeasureBtn").html(CN.getMeasureSystem());
    }); // if user changed measure system in setting page
    $("#gUnitList,#gToList").change(function () {
        $("#gResult").hide();
    }); // if user changed measure system in weight page
    $("#mUnitList,#mToList").change(function () {
        $("#mResult").hide();
    }); // if user changed measure system  in volume page
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
    }); //location popup ===not active===
    $("#gMeasure, #mMeasure, #tDegree").on("keypress", function (e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) {
            e.preventDefault();
            CN.validateInputNum(this);
            this.blur(); //close keyboard in mobile
        }
    }); //show result if user pressed enter at input
    //window.location = "index.html";
    //CN.getCountry();
    $(function () {
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
            break;
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
    if ((ui.toPage[0].id == "home") && (ui.prevPage.length == 0)) {
        //var popupPos = $("#popupPos");
        $("#locationPopup").popup({
            positionTo: "#popupPos",
            overlayTheme: "b",
            transition: "pop",
            history: false
        }); //.popup("open");
        CN.setMeasureSystem();
        CN.getData();
    }
});
//--------------Const Var's & methods-----------------------------
var CN = (function () {
    function CN() {
    }
    CN.getAllIng = function () {
        return this.allIng;
    }; //get private allAll
    CN.geocodingRequest = function (lonlat) {
        return "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + lonlat + "&key=" + CN.apiKey;
    }; // address builder for google maps
    CN.getAndroidLocationP = function () {
        try {
            console.log("request to android");
            Android.requestLocation();
        }
        catch (e) {
            console.log(e);
        }
        finally {
        }
    }; //display android location permeation request for marshmallow
    CN.getCountry = function (fAndroid) {
        console.log("getCountry Activated");
        console.log("fAndroid: " + fAndroid + "");
        if (fAndroid != true) {
            CN.getAndroidLocationP();
        }
        CN.oldMeasureSystem = CN.getMeasureSystem();
        function geoSuccess(pos) {
            $("#loading").popup("open");
            var lat = pos.coords.latitude;
            var lon = pos.coords.longitude;
            var lonlat = lat + "," + lon;
            console.log(CN.geocodingRequest(lonlat));
            $.getJSON(CN.geocodingRequest(lonlat), function (data) {
                var locationData = data;
                var result = data.results[0].address_components;
                result.forEach(function (item) {
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
                });
            }).fail(function () {
                CN.errorLoadingData();
            });
        } // if navigator geoLocation request success
        function geoError(error) {
            console.log(error);
            try {
                Android.showToast("Allow location and try again");
            }
            catch (e) {
                console.log(e);
            }
            finally {
            }
            CN.errorLoadingData();
        } // if navigator geoLocation request error
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError); // send the request
    }; //get countryfrom user and get the relevant data
    CN.setMeasureSystem = function (mSystem) {
        if (mSystem) {
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
        }
        else {
            CN.measureSystem = (localStorage.getItem("bConverterMeasureSystem")) ?
                localStorage.getItem("bConverterMeasureSystem") : "EU";
            // check if measure system exist in local storage if not set default
            localStorage.setItem("bConverterMeasureSystem", CN.measureSystem); //update local storage
        }
        CN.bConvertData = "data/data" + CN.measureSystem + ".json"; // update data file address
        console.log("CN.measureSystem: " + CN.measureSystem);
        $(".pSystemMeasureBtn").html(CN.measureSystem); // update indicator
        return CN.measureSystem;
    }; // setter for measure System
    CN.getMeasureSystem = function () {
        //CN.setMeasureSystem();
        return CN.measureSystem;
    }; //measure system is private
    CN.dataToSettingPage = function () {
        console.log("data to setting page");
        var key = "bConverterData" + CN.measureSystem;
        var data = localStorage.getItem(key);
        var obResponse = JSON.parse(data); //parse response
        var volume = new VolumeIng(obResponse.volume.ml[0].iName, obResponse.volume.ml[0].iCup, obResponse.volume.ml[0].iSpoon, obResponse.volume.ml[0].iTeaspoon);
        $("#settingMeasure").html(volume.print());
    }; // change data in setting page base on measure system
    CN.errorLoadingData = function () {
        console.log("error loading data ");
        CN.setMeasureSystem(CN.oldMeasureSystem); //go back to previous
        $("#errorMsg").html("Can't Load Data").fadeIn(1000).delay(3000).fadeOut(1000); //display error msg
        $("[name=mSystem]").prop('checked', false).checkboxradio("refresh");
        $("#r" + CN.getMeasureSystem()).prop('checked', true).checkboxradio("refresh"); //update radioCheckboxes
        CN.dataToSettingPage();
        CN.loadingOff();
    }; // show msg if cant get data
    CN.dataToArray = function (className) {
        var key = "bConverterData" + CN.measureSystem;
        var data = localStorage.getItem(key);
        var url = "";
        var obResponse = JSON.parse(data); //parse response
        switch (className) {
            case "WeightIng":
                CN.allIng = new AllIng();
                obResponse.weight.factors.forEach(function (item) { return CN.allIng.pushFactors(new Factor(item.fName, item.fValue)); });
                url = "#pWeight";
                for (var i = 0; i < obResponse.weight.gram.length; i++) {
                    CN.allIng.pushIngredient(new WeightIng(obResponse.weight.gram[i].iName, obResponse.weight.gram[i].iCup, obResponse.weight.gram[i].iSpoon, obResponse.weight.gram[i].iTeaspoon));
                }
                break;
            case ("VolumeIng"):
                CN.allIng = new AllIng();
                obResponse.volume.factors.forEach(function (item) { return CN.allIng.pushFactors(new Factor(item.fName, item.fValue)); });
                url = "#pVolume";
                CN.allIng.pushIngredient(new VolumeIng(obResponse.volume.ml[0].iName, obResponse.volume.ml[0].iCup, obResponse.volume.ml[0].iSpoon, obResponse.volume.ml[0].iTeaspoon));
                break;
            case ("Temperature"):
                CN.allIng = new AllIng();
                url = "#pTemperature";
                for (var i = 0; i < obResponse.temperature.length; i++) {
                    CN.allIng.pushIngredient(new Temperature(obResponse.temperature[i].iName));
                }
                break;
        }
        //CN.allIng.printIngArray();
        CN.putDataInSelectList(className); // put ingredients names in the select list
        $.mobile.changePage(url, {
            dataUrl: "h",
            showLoadMsg: false,
            transition: CN.bTransition
        }); // go to the page
    }; //get json string, parse it, put in array, display to user
    CN.getData = function (className) {
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
        var tempResponse;
        var key = "bConverterData" + CN.measureSystem;
        var localstoregeVersion = localStorage.getItem("bConverterDataVersion");
        var page = CN.activePage;
        console.log(page);
        if (localstoregeVersion != CN.dataVersion) {
            for (var i = (localStorage.length); i >= 0; i--) {
                var keyToDelete = String(localStorage.key(i));
                if (keyToDelete.startsWith("bConverterData")) {
                    localStorage.removeItem(keyToDelete + "");
                }
            }
        }
        if (localStorage.getItem(key) && localstoregeVersion == CN.dataVersion) {
            tempResponse = localStorage.getItem(key); //get response
            if (CN.activePage == "pSetting") {
                CN.dataToSettingPage();
            }
            console.log("data from localstorage");
            CN.loadingOff();
            $("#pSystemMeasureBtn").html(CN.getMeasureSystem());
        }
        else {
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
    }; //generic method to get data from server or localstorage and put it in the ingredients array
    //--------DOM, input, result -------------
    CN.putDataInSelectList = function (className) {
        var listId = "";
        var unitListId = "";
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
        var select = document.getElementById(listId);
        $(select).empty();
        select.length = 0;
        for (var i = 0; i < CN.allIng.getIngredients().length; i++) {
            var opt = document.createElement("option"); //create option
            opt.value = i.toString(); // put value in option
            opt.text = CN.allIng.getIngredients()[i].ingName(); // put text in option
            //if (i == 0) {opt.setAttribute("selected", "true");}
            select.appendChild(opt); //put option in the list
        }
        $("#" + listId).selectmenu().selectmenu("refresh"); // refresh list to show the first ingridiante
        if (unitListId != "") {
            select = document.getElementById(unitListId);
            select.length = 0;
            for (var i = 0; i < CN.allIng.getFactors().length; i++) {
                var opt = document.createElement("option"); //create option
                opt.value = i.toString(); // put value in option
                opt.text = CN.allIng.getFactors()[i].getName(); // put text in option
                //if (i == 0) {opt.setAttribute("selected", "true");}
                select.appendChild(opt); //put option in the list
            }
        }
        $("#" + unitListId).selectmenu().selectmenu('refresh');
        //select.value = "1";
    }; // method to put options in select ingredients html list
    CN.validateInputNum = function (element) {
        var measure = parseInt($(element).val());
        var rgx = /\d/;
        console.log("is:" + rgx.test(measure.toString()));
        var eId = $(element).attr("id")[0];
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
        }
        else {
            console.log("pls enter a number");
            var currentBackground = $(element).parent().css("background-color"); //a.style.backgroundColor;
            $(element).parent().css("background-color", "rgba(255,0,0,0.7)");
            $(element).on("focus", function () {
                $(element).parent().css("background-color", currentBackground);
            });
            return false;
        }
    }; //validate user input and pass if validated
    CN.loadingOff = function () {
        setTimeout(function () {
            $("#loading").popup("close");
        }, 1500);
    };
    CN.clearResults = function () {
        $("#gResult").hide();
        $("#mResult").hide();
        $("#tResult").hide();
        $("#gMeasure").val("");
        $("#mMeasure").val("");
        $("#tDegree").val("");
    };
    CN.goToSetting = function () {
        $.mobile.changePage("#pSetting", {
            dataUrl: "h",
            showLoadMsg: true,
            transition: CN.bTransition
        }); // go to the page
    }; // go to setting page
    CN.goToAbout = function () {
        $.mobile.changePage("#pAbout", {
            dataUrl: "h",
            showLoadMsg: true,
            transition: CN.bTransition
        }); // go to the page
    }; // go to setting page
    CN.convertTool = function (tool, result) {
        return (result > 1) ? tool + "s" : tool;
    }; // get tool & result and return cups or cup
    CN.dataReady = false;
    CN.dataVersion = "V0.7.0 D08092016";
    CN.activePage = "home"; // to store active page
    CN.bConvertData = "data/dataEU.json"; //address for data file in use
    CN.bTransition = "slide";
    //private static query: string = "";
    //---------find country with google maps------------
    CN.apiKey = "AIzaSyDzyEu__JkZf-ao55rgd6BtLxhHk4493b4"; // api  key for google maps
    CN.userCountryLong = "";
    CN.userCountryShort = "";
    //---------measure system----------------
    CN.measureSystem = ""; // var for measure System
    CN.oldMeasureSystem = "";
    //---------- data handling ------------
    CN.ingRequest = new XMLHttpRequest(); //xhr to get ingredient from server
    return CN;
}()); // class for const variables and methods
//------------Classes-----------------------------------
var AllIng = (function () {
    function AllIng() {
        this.aIngredients = []; //array for all ingredients for a kind
        this.factors = [];
    }
    AllIng.prototype.pushFactors = function (factor) {
        this.factors.push(factor);
    }; //method to push factors to array
    AllIng.prototype.pushIngredient = function (ing) {
        this.aIngredients.push(ing);
    }; //method to push ingredient to array
    AllIng.prototype.printIngArray = function () {
        for (var i = 0; i < this.aIngredients.length; i++) {
            console.log(this.aIngredients[i].print());
        }
    };
    AllIng.prototype.getIngredients = function () {
        return this.aIngredients;
    };
    AllIng.prototype.getFactors = function () {
        return this.factors;
    };
    return AllIng;
}()); //generic class for array for ingredient for all child's of Ing
var Factor = (function () {
    function Factor(fName, fValue) {
        this.fName = fName;
        this.fValue = fValue;
    }
    Factor.prototype.getName = function () {
        return this.fName;
    };
    Factor.prototype.getValue = function () {
        return this.fValue;
    };
    Factor.prototype.factorize = function (num) {
        return num * this.fValue;
    };
    return Factor;
}());
var Ing = (function () {
    function Ing(iName) {
        this.iName = iName;
    }
    Ing.prototype.ingName = function () {
        return this.iName;
    };
    Ing.prototype.print = function () {
        return "";
    }; // for override
    Ing.prototype.convertResult = function (grams, tool, factor) {
        return -1;
    }; // for override
    return Ing;
}()); // class for one ingredient
var WeightIng = (function (_super) {
    __extends(WeightIng, _super);
    function WeightIng(iName, iCupTo, iSpoonTo, iTeaspoonTo) {
        _super.call(this, iName);
        this.iCupTo = iCupTo;
        this.iSpoonTo = iSpoonTo;
        this.iTeaspoonTo = iTeaspoonTo;
        this.iToCup = 1 / this.iCupTo;
        this.iToSpoon = 1 / this.iSpoonTo;
        this.iToTeaspoon = 1 / this.iTeaspoonTo;
    }
    WeightIng.prototype.print = function () {
        return _super.prototype.print.call(this) + " CupToGram:" + this.iCupTo + " SpoonToGram:" + this.iSpoonTo + " TeaspoonToGram:" + this.iTeaspoonTo;
    };
    //@Override
    WeightIng.prototype.convertResult = function (grams, tool, factor) {
        var result;
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
    }; //convert and get result in number
    WeightIng.gramResultToScreen = function () {
        var measure = parseFloat($("#gMeasure").val()); // get grams from user
        //let measureName: string = $("#gMeasureLabel").html(); //get measure label (garm or ml)
        var tool = $("#gToList").val(); //get tool from user
        var ingNumber = parseInt($("#gIngList").val()); //get ingredient from user
        var factorNumber = parseInt($("#gUnitList").val());
        var measureName = CN.getAllIng().getFactors()[factorNumber].getName();
        console.log(measureName);
        var factor = CN.getAllIng().getFactors()[factorNumber].getValue();
        console.log("measure: " + measure + " tool:" + tool);
        var result = CN.getAllIng().getIngredients()[ingNumber].convertResult(measure, tool, factor);
        if (result < 0) {
            $("#gResult").html("Can't convert to " + tool).show().css("display", "inline-block");
        }
        else {
            var toolToPrint = CN.convertTool(tool, result);
            $("#gResult").html("<p class='ingName'>" + CN.getAllIng().getIngredients()[ingNumber].ingName() + "</p>" + measure + " " + measureName + " = " + result + " " + toolToPrint).show().css("display", "inline-block"); // display result
        }
    }; // method to calculate convert result and show it to the user - for gram only
    WeightIng.className = "WeightIng";
    return WeightIng;
}(Ing)); // class for gram convert ingredient
var VolumeIng = (function (_super) {
    __extends(VolumeIng, _super);
    function VolumeIng(iName, iCupToMl, iSpoonToMl, iTeaspoonToMl) {
        _super.call(this, iName);
        this.iCupToMl = iCupToMl;
        this.iSpoonToMl = iSpoonToMl;
        this.iTeaspoonToMl = iTeaspoonToMl;
        this.iMlToCup = 1 / this.iCupToMl;
        this.iMlToSpoon = 1 / this.iSpoonToMl;
        this.iMlToTeaspoon = 1 / this.iTeaspoonToMl;
    }
    VolumeIng.prototype.print = function () {
        return _super.prototype.print.call(this) + "Cup = " + this.iCupToMl + "ml<br> Spoon = " + this.iSpoonToMl + "ml<br> Teaspoon = " + this.iTeaspoonToMl + "ml";
    };
    //@Override
    VolumeIng.prototype.convertResult = function (grams, tool, factor) {
        var result;
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
    };
    VolumeIng.mlResultToScreen = function () {
        var measure = parseFloat($("#mMeasure").val()); // get grams from user
        //let measureName: string = $("#mMeasureLabel").html(); //get measure label (garm or ml)
        var tool = $("#mToList").val(); //get tool from user
        var ingNumber = parseInt($("#mIngList").val()); //get ingredient from user
        console.log("measure: " + measure + " tool:" + tool);
        var factorNumber = parseInt($("#mUnitList").val());
        var measureName = CN.getAllIng().getFactors()[factorNumber].getName();
        console.log(measureName);
        console.log(measureName);
        var factor = CN.getAllIng().getFactors()[factorNumber].getValue();
        var result = CN.getAllIng().getIngredients()[ingNumber].convertResult(measure, tool, factor);
        if (result < 0) {
            $("#mResult").html("Can't convert to " + tool).show().css("display", "inline-block");
        }
        else {
            var toolToPrint = CN.convertTool(tool, result);
            $("#mResult").html(measure + " " + measureName + " = " + result + " " + toolToPrint).show()
                .css("display", "inline-block"); // display result
        }
    }; // method to calculate convert result and show it to the user - for ml only
    VolumeIng.className = "VolumeIng";
    return VolumeIng;
}(Ing)); // class for gram convert ingredient
var Temperature = (function (_super) {
    __extends(Temperature, _super);
    function Temperature(iName) {
        _super.call(this, iName);
    }
    //@Override
    Temperature.prototype.convertResult = function (degree, scale) {
        var result = 0;
        switch (this.ingName()) {
            case "Fahrenheit":
                result = Math.round((degree - 32) / 1.8);
                break;
            case "Celsius":
                result = Math.round((degree * 1.8) + 32);
                break;
        }
        return result;
    };
    Temperature.temperatureResultToScreen = function () {
        var degree = parseInt($("#tDegree").val()); // get degree from user
        var scaleNumber = parseInt($("#tIngList").val()); //get scale number from user
        console.log("degree: " + degree);
        var result = CN.getAllIng().getIngredients()[scaleNumber].convertResult(degree, null);
        switch (CN.getAllIng().getIngredients()[scaleNumber].ingName()) {
            case "Fahrenheit":
                $("#tResult").html(degree + "&#176 Fahrenheit = " + result + "&#176 Celsius").show().css("display", "inline-block");
                break;
            case "Celsius":
                $("#tResult").html("#tResult").html(degree + "&#176 Celsius = " + result + "&#176 Fahrenheit").show().css("display", "inline-block");
                break;
        }
    }; // method to calculate convert result and show it to the user - for temperature only
    Temperature.toggleCeFa = function () {
        //let selected: HTMLSelectElement = <HTMLSelectElement>document.getElementById("tIngList");
        var selectedStr = $("#tIngList").val(); //selected.value;
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
    };
    return Temperature;
}(Ing)); //class for all Temperature related methods
//# sourceMappingURL=bConverter.new.js.map