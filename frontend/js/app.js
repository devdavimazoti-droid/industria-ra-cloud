document.addEventListener(
    "DOMContentLoaded",
    () => {
        /* Referencias da cena */

        const scene =
            document.querySelector("#ar-scene");
        const target =
            document.querySelector("#target");
        const cameraElement =
            document.querySelector("#ar-camera");

            /* Referencias da Interface */
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
            document.querySelector("#info-detail");
        const closeButton =
            document.querySelector("#close-panel");
        const statusButton = 
            document.querySelector("#status-button");
        const statusResult =
            document.querySelector("#status-result");
            
        /* Endereco da API Flask do Back */
        const API_URL = "http://localhost:5000";

        const hotspots =
            Array.from(
                document.querySelectorAll(".hotspot")
            );

            /* Rastreando target true and false */
            let tracking =
                false;

        /* Info dos Botões */

        const information = {
            Usinagem: {
                title: "Área de Usinagem",
                text: "Área onde ocorre o processo de usinagem das peças",
                detail: "Dados simulados, apenas para fins didáticos"
            },
            Painel: {
                title: "Painel de Comando",
                text: "Interface que controla o centro de usinagem",
                detail: "Dados simulados, apenas para fins didáticos"
            },
            seguranca: {
                title: "Proteção",
                text: "Estrutura de proteção que separa o operador da área de usinagem",
                detail: "Dados simulados, apenas para fins didáticos"
            },
            magazine: {
                title: "Magazine de Ferramentas",
                text: "Compartimento onde armazena ferramentas utilizadas durante a operação",
                detail: "Dados simulados, apenas para fins didáticos"
            },
            status: {
                title:"Monitoramento",
                text:"Dados vindo do Centro de Usinagem",
                detail:"Dados simulados, apenas para fins didáticos"
            }
        };
        /* Abre o painel com informações do hotspot */
        function showInformation(topicName) {
            const selected = information[topicName];

            if (!selected) {
                return;
            }

            panelTitle.textContent = selected.title;
            panelText.textContent = selected.text;
            panelDetail.textContent = selected.detail;
            statusResult.textContent = "";

            if (topicName === "status") {
                consultarStatus();
                statusButton.classList.remove("hidden");
                statusResult.classList.remove("hidden");
            } else {
                statusButton.classList.add("hidden");
                statusResult.classList.add("hidden");
            }
            panel.classList.remove("hidden");
        }
        /* Fecha Painel */
        function hideInformation() {
            panel.classList.add("hidden");
        }
        async function consultarStatus() {

            statusResult.textContent = "Consultando...";
            try {
                const resposta = await fetch(API_URL + "/api/maquina");
                if (!resposta.ok) {
                    throw new Error ("error " + resposta.status);
                }
            const dados = await resposta.json();

                statusResult.textContent =
                "Status: " + dados.status +
                " Temperatura: " + dados.temperatura + "°C" +
                " Vibração: " + dados.vibracao +
                " Atualização: " + dados.ultimaAtualizacao;
            } catch (erro) {
                statusResult.textContent =
                    "Não foi possivel consultar dados. "
            }
        }
        /* Evento de cada hotspot */
        hotspots.forEach((button) => {
            button.addEventListener("pointerup", (event) => {
                event.preventDefault();
                event.stopPropagation();

                const topicName = button.dataset.topic;
                showInformation(topicName);
            });
        });

        /* Botao Fechar */
        closeButton.addEventListener("pointerup", (event) => {
            event.preventDefault();
            hideInformation();
        });

        /* Botao de constultar status */
        statusButton.addEventListener("pointerup", (event) => {
            event.preventDefault();
            consultarStatus();

        });

        /* Mindar pronto */
        scene.addEventListener("arReady", () => {
            status.textContent = "Aponte para o centro de usinagem"
            badge.textContent = "PROCURANDO CENTRO USINAGEM"
        });

        /* Erro se não for possivel iniciar camera */
        scene.addEventListener("arError", () => {
            status.textContent = "Não foi possivel iniciar a Câmera"
            badge.textContent = "ERRO";
        });

        /* Target Encontrado */
        target.addEventListener ("targetFound",() =>{
            tracking = true;
            status.textContent = "Equipamento reconhecido"
            badge.textContent = "RA ATIVA"

            hotspots.forEach((button) => {
                button.classList.add("visible");
            });
        });
          /* Target perdido */
        target.addEventListener("targetLost", () => {
            tracking = false;
            status.textContent = "Equipamento não Reconhecido";
            badge.textContent = "PROCURANDO EQUIPAMENTO";

            hotspots.forEach((button) => {
                button.classList.remove("visible");
            });

            hideInformation();
        });

         /* Acompanha o target na tela (3D -> 2D) */
        function updateHotspotPositions() {
            requestAnimationFrame(updateHotspotPositions);

            if (!tracking) {
                return;
            }

            const camera = cameraElement.getObject3D("camera");

            if (!camera || !target.object3D) {
                return;
            }

            target.object3D.updateMatrixWorld(true);
            camera.updateMatrixWorld(true);

            hotspots.forEach((button) => {
                const localPoint = new THREE.Vector3(
                    Number(button.dataset.x),
                    Number(button.dataset.y),
                    Number(button.dataset.z)
                );

                const worldPoint = target.object3D.localToWorld(localPoint);

                const projectedPoint = worldPoint.clone().project(camera);

                const screenX = (projectedPoint.x * 0.5 + 0.5) * window.innerWidth;
                const screenY = (-projectedPoint.y * 0.5 + 0.5) * window.innerHeight;

                button.style.left = `${screenX}px`;
                button.style.top = `${screenY}px`;

                const insideScreen =
                    projectedPoint.z > -1 &&
                    projectedPoint.z < 1 &&
                    screenX > -80 &&
                    screenX < window.innerWidth + 80 &&
                    screenY > -80 &&
                    screenY < window.innerHeight + 80;

                button.style.visibility = insideScreen ? "visible" : "hidden";
                });
        }

        updateHotspotPositions();
    }
);