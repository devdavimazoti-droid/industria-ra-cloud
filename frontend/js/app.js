document.addEventListener(
    "DOMContetLoaded",
    () => {
        /*
        *Codigo de aplicação 
        *ficara aqui
        */
    }
);

/* Referencias da cena */
const scene = 
    document.querySelector("#ar-scene");
const target = 
    document.querySelector("target");
const cameraElement = 
    document.querySelector("#ar-camera");

/* Referencias da interface */

const status =
    document.querySelector("#status");
const badge = 
    document.querySelector("#badge");
const panel =
    document.querySelector("#info-panel");
const panelTitle = 
    document.querySelector("#info-title");
const panelText =
    document.querySelector("#info-text");
const panelDetail =
    document.querySelector("#close-panel");
const closeButton = 
    document.querySelector("#close-panel");

/* Localizando os hotspots */

consthotspots =
    Array.from(
        document.querySelectorAll(
            ".hotspot"
        )
    );

/* Rastreando target true and false */

let tracking =
    false;

/* Informações dos botões */

const information = {
    Aréa: {
        title: 
        "Àrea de Usinagem",
        text:
        "",
        detail:
        "aaa"
    },

}

