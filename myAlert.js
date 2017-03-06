//Fichero que se podría utilizar para la definición de aquellas clases que utilicemos de modo global

export var ALERT = (function () {
    var my = {};

    my.show = function (id, mensaje) {
        var frag = document.createDocumentFragment(),
        temp = document.createElement('div');
        temp.innerHTML = "<div class=\"modalLayer\"></div>"
            + "<div class=\"advertenciaHolder\">"
                + "<div id=\"" + id + "\" class=\"advertencia box\">"
                    + "<div class=\"box-title\">"
                        + "<i class=\"fa fa-warning\"></i> Alerta"
                        + "<div class=\"cierre\">"
                            + "<i class=\"fa fa-times\"></i>"
                        + "</div>"
                    + "</div>"
                    + "<div class=\"content\">"
                        + mensaje
                    + "</div>"
                + "</div>"
            + "</div>";
        while (temp.firstChild) {
            frag.appendChild(temp.firstChild);
        }
        document.body.insertBefore(frag, document.body.childNodes[0]);

        document.getElementsByClassName("cierre")[0].addEventListener("click", function () {
            document.body.removeChild(document.getElementsByClassName("modalLayer")[0]);
            document.body.removeChild(document.getElementsByClassName("advertenciaHolder")[0]);
        });
    }

    my.confirm = function (id, mensaje, callbackOk, callbackCancel) {
        var frag = document.createDocumentFragment(),
        temp = document.createElement('div');
        temp.innerHTML = "<div class=\"modalLayer\"></div>"
            + "<div class=\"advertenciaHolder\">"
                + "<div id=\"" + id + "\" class=\"advertencia box\">"
                    + "<div class=\"box-title\">"
                        + "<i class=\"fa fa-warning\"></i> Alerta"
                        + "<div class=\"cierre\">"
                            + "<i class=\"fa fa-times\"></i>"
                        + "</div>"
                    + "</div>"
                    + "<div class=\"content\">"
                        + mensaje
                    + "</div>"
                    + "<div class=\"box-footer\">"
                        + "<div class=\"confirmAccept btn btn-default btn-xs buttonClass\">"
                            + "<b class=\"fa fa-check\"></b>Aceptar"
                        + "</div>"
                        + "<div class=\"confirmCancel btn btn-default btn-xs buttonClass\">"
                            + "<b class=\"fa fa-times\"></b>Cancelar"
                        + "</div>"
                    + "</div>"
                + "</div>"
            + "</div>";
        while (temp.firstChild) {
            frag.appendChild(temp.firstChild);
        }
        document.body.insertBefore(frag, document.body.childNodes[0]);

        document.getElementsByClassName("cierre")[0].addEventListener("click", function () {
            document.body.removeChild(document.getElementsByClassName("modalLayer")[0]);
            document.body.removeChild(document.getElementsByClassName("advertenciaHolder")[0]);
        });

        document.getElementsByClassName("confirmAccept")[0].addEventListener("click", function () {
            document.body.removeChild(document.getElementsByClassName("modalLayer")[0]);
            document.body.removeChild(document.getElementsByClassName("advertenciaHolder")[0]);
            callbackOk();
        });

        document.getElementsByClassName("confirmCancel")[0].addEventListener("click", function () {
            document.body.removeChild(document.getElementsByClassName("modalLayer")[0]);
            document.body.removeChild(document.getElementsByClassName("advertenciaHolder")[0]);
            callbackCancel();
        });
    }

    return my;
} ());
