import os
import json
import random
import string
import csv

# Define a raiz baseada no local do script
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_DIR = os.path.join(ROOT_DIR, "music")
FOLDER_IA = os.path.join(MUSIC_DIR, "ia")
FOLDER_REAL = os.path.join(MUSIC_DIR, "real")

LOG_FILE = os.path.join(ROOT_DIR, "log.csv")
JSON_FILE = os.path.join(ROOT_DIR, "lista.json")
SECRET = "g3p4_ultra_hidden_2026"

def gerar_nome_cripto():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=4)) + ".mp3"

def hash_js_like(s):
    h = 0
    for c in s:
        h = (h << 5) - h + ord(c)
        h &= 0xFFFFFFFF
    if h & 0x80000000:
        h = -((~h + 1) & 0xFFFFFFFF)
    return str(h)

def carregar_log():
    processados = set()
    if os.path.exists(LOG_FILE):
        # Usamos utf-8-sig aqui também para ler corretamente os acentos
        with open(LOG_FILE, "r", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                processados.add(row['Nome'])
    return processados

def processar_pasta(caminho_pasta, sufixo, tipo_label, log_data, lista_json, processados_names):
    if not os.path.exists(caminho_pasta):
        return

    arquivos = sorted([f for f in os.listdir(caminho_pasta) if f.endswith(".mp3")])
    contador = 1

    for arquivo_orig in arquivos:
        if arquivo_orig in processados_names:
            continue
        
        # Define o padrão solicitado: IA -> B | REAL -> A
        nome_codificado = f"{str(contador).zfill(2)}-{sufixo}.mp3"
        
        caminho_origem = os.path.join(caminho_pasta, arquivo_orig)
        caminho_destino_temp = os.path.join(MUSIC_DIR, nome_codificado)

        # Move e renomeia temporariamente para /music
        os.rename(caminho_origem, caminho_destino_temp)

        # Criptografa o nome do arquivo
        nome_final_cripto = gerar_nome_cripto()
        # Garante que o nome aleatório não colida com algum já existente no JSON
        while any(d['file'] == nome_final_cripto for d in lista_json):
            nome_final_cripto = gerar_nome_cripto()
            
        caminho_final = os.path.join(MUSIC_DIR, nome_final_cripto)
        os.rename(caminho_destino_temp, caminho_final)

        # Gera o Hash para o JSON
        k_hash = hash_js_like(nome_final_cripto + SECRET + sufixo)
        lista_json.append({"file": nome_final_cripto, "k": k_hash})

        # Adiciona ao Log (com acentuação preservada)
        log_data.append({
            "Nome": arquivo_orig,
            "Tipo": tipo_label,
            "Codificação": nome_codificado,
            "Nome criptografado": nome_final_cripto
        })

        print(f"[{tipo_label}] {arquivo_orig} -> {nome_final_cripto}")
        contador += 1

def main():
    # Verifica se a pasta music existe para evitar erro de IO
    if not os.path.exists(MUSIC_DIR):
        os.makedirs(MUSIC_DIR)

    processados_names = carregar_log()
    
    lista_json = []
    if os.path.exists(JSON_FILE):
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            try:
                lista_json = json.load(f)
            except: 
                lista_json = []

    # ====================================================================
    # CORREÇÃO: Remove da lista_json arquivos que não existem mais na pasta
    # ====================================================================
    tamanho_original = len(lista_json)
    lista_json = [item for item in lista_json if os.path.exists(os.path.join(MUSIC_DIR, item['file']))]
    houve_remocao = len(lista_json) < tamanho_original

    if houve_remocao:
        print(f"🗑️  Limpeza: {tamanho_original - len(lista_json)} arquivo(s) ausente(s) removido(s) do JSON.")

    novos_logs = []

    # Passo 1: IA recebe sufixo B
    processar_pasta(FOLDER_IA, "B", "IA", novos_logs, lista_json, processados_names)

    # Passo 2: REAL recebe sufixo A
    processar_pasta(FOLDER_REAL, "A", "REAL", novos_logs, lista_json, processados_names)

    # Se não houver novos logs E não houve remoção, encerra.
    if not novos_logs and not houve_remocao:
        print("\nNenhuma alteração necessária. Nenhum arquivo novo adicionado ou removido.")
        return

    # Passo 4: Salva o JSON (agora 100% espelhando os arquivos reais)
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(lista_json, f, indent=2)

    # Passo 5: Salva o Log CSV com suporte a acentos no Excel (utf-8-sig)
    if novos_logs:
        file_exists = os.path.isfile(LOG_FILE)
        with open(LOG_FILE, "a", newline="", encoding="utf-8-sig") as f:
            fieldnames = ["Nome", "Tipo", "Codificação", "Nome criptografado"]
            writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter=';')
            
            if not file_exists:
                writer.writeheader()
            writer.writerows(novos_logs)
            
        print(f"\n✅ Finalizado! {len(novos_logs)} novas músicas processadas e log atualizado.")
    else:
        print("\n✅ Finalizado! Apenas limpeza do JSON foi realizada.")

if __name__ == "__main__":
    main()