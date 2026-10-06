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
                detail: "Orientação didática: antes de iniciar, verificar se não há cavaco acumulado e se a peça está bem fixada."
            },
            Painel: {
                title: "Painel de Comando",
                text: "Interface que controla o centro de usinagem",
                detail: "Orientação didática: conferir se a tela e o teclado respondem normalmente e se o botão de emergência está livre e visível."
            },
            seguranca: {
                title: "Proteção",
                text: "Estrutura de proteção que separa o operador da área de usinagem",
                detail: "Orientação didática: a porta deve ficar fechada durante a usinagem. Conferir se ela fecha direito e se o visor não tem trincas."
            },
            magazine: {
                title: "Magazine de Ferramentas",
                text: "Compartimento onde armazena ferramentas utilizadas durante a operação",
                detail: "Orientação didática: verificar se as ferramentas estão bem encaixadas e se não há ferramenta danificada ou fora do lugar."
            },
            status: {
                title: "Monitoramento",
                text: "Dados vindo do Centro de Usinagem",
                detail: "Dados simulados, apenas para fins didáticos"
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
                const resposta = await fetch(API_URL + "/api/maquina", {
                    signal: AbortSignal.timeout(10000)
                });
                if (resposta.status === 404) {
                    statusResult.textContent = "Aguardando dados do equipamento..."
                    return;
                }
                if (!resposta.ok) {

                    throw new Error("error" + resposta.status);
                }

                const dados = await resposta.json();

                statusResult.textContent =
                    "Status: " + dados.status + "\n" +
                    " Temperatura: " + dados.temperatura + "°C\n" +
                    " Vibração: " + dados.vibracao + "\n" +
                    " Atualização: " + dados.ultimaAtualizacao.split("T")[1] + "\n" +
                    " HorasUso: " + dados.manutencao.horasUso + "\n" +
                    "Próxima revisão: " + dados.manutencao.proximaRevisao;

            } catch (erro) {
                console.error("Falha ao conectar no backend:", erro);
                statusResult.textContent =
                    "Não foi possivel consultar dados. " +
                    "Verificar disponibilidade de serviço. "
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
        target.addEventListener("targetFound", () => {
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