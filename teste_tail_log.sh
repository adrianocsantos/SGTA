#!/bin/bash

# nome do arquivo de saída
ARQUIVO="C:\\Users\\asant\\Downloads\\AAS 1.log"

# Loop de 1 a 100000
for i in $(seq 1 100000); do
	# Escreve o número atual seguido por uma quebra de linha no arquivo
	echo "$i" >> "$ARQUIVO"

	# A cada 100 registros, pausa 3 segundos
	if [ $((i % 100)) -eq 0 ]; then
		sleep 3
	fi
done

echo "Gravação concluída em $ARQUIVO"
