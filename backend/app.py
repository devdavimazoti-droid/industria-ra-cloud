import paho.mqtt.client as mqtt
from flask import Flask, jsonify
import json

dados_maquina = {}

broker = "localhost"
port = 1883
topicStatus = "centroUsi/status"

app = Flask(__name__)


def on_mensagem(client, userdata, msg):
    global dados_maquina

    # Pegar os dados em bytes que está no broker e transforma numa string em formato json na norma utf-8
    dados_texto = msg.payload.decode('utf-8')
    
    # Converte a string em formato JSON para um Dicionário Python na variável global 
    dados_maquina = json.loads(dados_texto)
    print(f"MQTT Dados atualizados: {dados_maquina}")

# Cria o objeto cliente que fará a conexão e o envio das mensagens MQTT
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

client.on_message = on_mensagem

client.connect(broker, port, 60) # Estabelece a conexão com o broker usando IP, porta e tempo de keepalive

client.subscribe(topicStatus)
# Inscreve o cliente no tópico definido, permitindo receber mensagens publicadas nele

client.loop_start()
# Mantém o cliente em execução contínua, aguardando e processando mensagens recebidas


# Requisição para poder acessar o dado capturado nesse instante
@app.route("/api/maquina")
def status_maquina():
    if not dados_maquina:
        return jsonify({"mensagem": "Nenhum dado recebido até o momento"}), 404
    return jsonify(dados_maquina), 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)