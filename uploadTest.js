jQuery("document").ready(function () {

    var importador = {
        logDataError: "",
        logDataWarning: "",
        logDataResult: "",
        sharedStringsReader: new FileReader(),
        sheet1Reader: new FileReader(),
        dataRows: {},
        numFilas: 0,
        registros: 0,
        errores: 0,
        postProcessingRows: []
    };

    importador.checkStructure = function (rowStructure) {
        var fileStructure = this.dataRows[0];
        if (fileStructure.length == rowStructure.length) {
            for (x = 0; x < rowStructure.length; x++) {
                if (fileStructure[x] != rowStructure[x]) {
                    this.logDataError += "<div>La estructura del fichero no es la esperada, donde se esperaba el campo " + rowStructure[x]
                        + " se ha recibido " + fileStructure[x];
                    return false;
                }
            }
        } else {
            this.logDataError += "<div>El número de campos del fichero no es el esperado</div>";
            return false;
        }
        return true;
    }

    importador.loadFile = function (file, structure, callbackRowFunction, serverCall, callbackPostProdFunction, postProcessingAction) {
        var that = this;
        console.log(file.type);
        //Comprobacion de que el tipo del fichero pasado sea excel compatible con open xml documents
        if (file.type != "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
            this.logDataError += "El formato del fichero no es un formato excel compatible con la importación<br/>";
            this.printLog();
            return;
        }

        //Si el fichero es un .xslx se descomprimirá utilizando el plugin zip.js y se extraerán el fichero sharedString.xml y el
        // fichero sheet1.xml, que contienen respectivamente las cadenas de texto del excel y la ordenación de celdas y columnas del mismo.
        zip.workerScriptsPath = "https://rawgit.com/gildas-lormeau/zip.js/master/WebContent/";
        var entrySharedStrings;
        var entrySheet1;
        zip.createReader(new zip.TextReader(file), function (reader) {
            reader.getEntries(function (entries) {
                for (var entry in entries) {
                    if (entries[entry].filename == "xl/sharedStrings.xml")
                        entrySharedStrings = entry;
                    if (entries[entry].filename == "xl/worksheets/sheet1.xml")
                        entrySheet1 = entry;
                }
                entries[entrySharedStrings].getData(new zip.BlobWriter(), function (data) {
                    that.sharedStringsReader.readAsText(data);
                    that.sharedStringsReader.onload = function () {
                        //No se lanza la carga del fichero con los datos hasta que se haya cargado el fichero con las cadenas comunes
                        entries[entrySheet1].getData(new zip.BlobWriter(), function (data) {
                            that.sheet1Reader.readAsText(data);
                        });
                    }
                });
                reader.close();
            });
        });

        this.sheet1Reader.onload = function () {
            //En este punto se tienen cargados los dos ficheros que componen el xls. Ambos se pasan como parámetro a un método que almacenará
            //  la información contenida en dichos xml en un array de datos
            that.processXMLFiles(that.sharedStringsReader.result, this.result);

            if (!that.checkStructure(structure)) {
                that.printLog();
                return;
            }
            jQuery("#total").html(that.numFilas);
            jQuery("#importProgress").show();
            that.printLog();
            var processed = 0;
            for (x = 1; x <= that.numFilas; x++) {
                jQuery("#cuantos").html(x);
                jQuery("#progressBar").attr("value", x / (that.numFilas))
                console.log("procesando registro: " + that.dataRows[x]);
                /*var serverResponseString = that.sendRecordToServer(new callbackRowFunction(that.dataRows[x]), serverCall);
                var serverResponse = JSON.parse(serverResponseString, serverCall);
                if (serverResponse.mensaje.indexOf("importWarning") != -1)
                    that.logDataWarning += serverResponse.mensaje;
                else
                    that.logDataError += serverResponse.mensaje;
                that.errores += serverResponse.errores;
                if (serverResponse.insertado)
                    that.registros++;
                that.printLog();
                if (postProcessingAction != "" && serverResponse.errores == 0) {
                    that.postProcessingRows[processed] = that.dataRows[x];
                    processed++;
                }*/
            }
            that.logDataResult += "<div>Finalizado el proceso de importación. Se han cargado <strong>" + that.registros
                + "</strong> registros y se han producido <strong>" + that.errores + "</strong> errores durante la importación";
            that.printLog();
            if (postProcessingAction != "" && that.postProcessingRows.length > 0) {
                jQuery.ajax({ async: false,
                    cache: false,
                    data: JSON.stringify(new callbackPostProdFunction(that.postProcessingRows)),
                    dataType: "text",
                    contentType: "text/plain",
                    type: "POST",
                    url: postProcessingAction,
                    error: function () {
                        alert("Se ha producido un error durante el postprocesado de la información importada");
                    }
                });
            }
        }
    }

    importador.processXMLFiles = function (xmlSharedStrings, xmlSheet1) {
        var that = this;
        var xmlSheet1Object = jQuery.parseXML(xmlSheet1);
        var xmlSharedStringsObject = jQuery.parseXML(xmlSharedStrings);
        var arrayCadenas = jQuery(xmlSharedStringsObject).find("si");
        var filaArray = new Array();
        var rowIndex = 1;
        var columnIndex;
        //Para calcular el límite de las columnas se obtiene la segunda parte del atributo spans del primer nodo row (que corresponde a la fila
        //de cabeceras), y le restamos uno, ya que empezamos a contar en 0 pero excel comienza en 1.
        var maxColumn = String.fromCharCode("A".charCodeAt(0) + (parseInt(jQuery(xmlSheet1Object).find('row:first').attr("spans").split(":")[1]) - 1));
        jQuery(xmlSheet1Object).find("row").each(function () {
            columnIndex = "A";
            jQuery(this).find("c").each(function () {
                var node = jQuery(this).find("v:first-child");
                //Añadido de columnas vacías mientras la columna no se corresponda con la esperada
                while (jQuery(this).attr("r") !== columnIndex + rowIndex) {
                    filaArray.push("");
                    columnIndex = String.fromCharCode(columnIndex.charCodeAt(0) + 1);
                }
                if (jQuery(this).attr("t") == "s") {
                    var numCadena = node.text();
                    filaArray.push(jQuery(arrayCadenas[numCadena]).text().trim());  //Se limpian espacios en blanco antes de cargar
                } else {
                    filaArray.push(node.text().replace(/\./gi, ",").trim());   //Se limpian espacios en blanco antes de cargar
                }
                columnIndex = String.fromCharCode(columnIndex.charCodeAt(0) + 1);
            });
            //Si tras recorrer todas las columnas de datos no se ha llegado a la última columna añadir columnas vacías hasta el final.
            while (columnIndex <= maxColumn) {
                filaArray.push("");
                columnIndex = String.fromCharCode(columnIndex.charCodeAt(0) + 1);
            }
            that.dataRows[that.numFilas] = filaArray;
            filaArray = new Array();
            that.numFilas++;
            rowIndex++;
        });
        that.numFilas--;
    }

    /*importador.sendRecordToServer = function (registro, serverCall) {
        var serverResponse;
        jQuery.ajax({ async: false,
            cache: false,
            url: serverCall,
            dataType: "json",
            contentType: "json",
            data: registro,
            method: "POST",
            success: function (response) {
                serverResponse = JSON.stringify(response);
            }
        });
        return serverResponse;
    }*/

    importador.printLog = function () {
        jQuery("#response").html(this.logDataError + this.logDataWarning + this.logDataResult);
    }

    //Plugin para habilitar la llamada al importador desde ficheros externos
    //Necesitará un objecto structure con la estructura de campos que esperamos del fichero del que se va a importar, un método de callback
    //callbackRowFunction que será llamado internamente para cargar los datos de un registro del fichero y pasárselos a la llamada AJAX definida
    //por el parámetro serverCall. También se pasa el fichero que se está subiendo y dos parámetros opcionales: callbackPostProdFunction y 
    //postProcessingAction, que indican el procesado de datos y la url a la que enviar una lista de datos migrados tras la importación.
    jQuery.fn.loadImport = function (file, structure, callbackRowFunction, serverCall, callbackPostProdFunction, postProcessingAction) {
        importador.loadFile(file, structure, callbackRowFunction, serverCall, callbackPostProdFunction, postProcessingAction);
    }

    jQuery("#openUpload").on("click", function () {
        jQuery('input[type="file"]').click();
    });

    jQuery('input[type="file"]').on("change", function () {
        jQuery("#myFile").val(jQuery(this).val());
    });
    
});