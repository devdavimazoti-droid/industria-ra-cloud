import paho.mqtt.client as mqtt
import time
import random 
import json
from datetime import datetime
from zoneinfo import ZoneInfo

broker = "localhost"
port = 1883

topicStatus = "centroUsi/status"

def publicacaoDados(status, horaUso, proximaRevisao,):

    dados = {
        "status" : status,
        "temperatura" : round(random.uniform(40, 100), 2),
        "vibracao" : round(random.uniform(1, 10), 2),
        "ultimaAtualizacao" : datetime.now(ZoneInfo("America/Sao_Paulo")).strftime('%Y-%m-%dT%H:%M:%S'),
        "manutencao" : {
            "horasUso" : horaUso,
            "proximaRevisao" : proximaRevisao
        }
    }

    mensagem = json.dumps(dados)
    client.publish(topicStatus,mensagem)
    print(f"Enviado: {mensagem}\n")
    time.sleep(5)


client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

client.connect(broker, port, 60)

while True:
    publicacaoDados("EM OPERAÇÂO", "300", '12-03-2027')