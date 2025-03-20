# Variables pour les adresses et paramètres
MARKETPLACE_ADDRESS := 0xdde379ee89d1d96a1c4bdd25bb90502db8469a25
NFT_ADDRESS := 0xDB6f4c2CE3D4A96d0830073Dd09CAD92971CdE65
TOKEN_ID := 1
PRICE := 1000000000000000000
SENDER := 0xAf1A5dE9Ea14B500c2F30c28e2Cfac0eA7043De2
RPC_URL := https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY := your_private_key_here

# Fonction pour lister l'item - reproduit l'erreur pour déboguer
call-list-item:
	@echo "🔍 Appel de listItem sur le contrat Marketplace..."
	cast call $(MARKETPLACE_ADDRESS) "listItem(address,uint256,uint256)" $(NFT_ADDRESS) $(TOKEN_ID) $(PRICE) \
	--rpc-url $(RPC_URL) --from $(SENDER)

# Vérifier qui est le propriétaire actuel du NFT
check-owner:
	@echo "👤 Vérification du propriétaire du NFT..."
	cast call $(NFT_ADDRESS) "ownerOf(uint256)" $(TOKEN_ID) --rpc-url $(RPC_URL)

# Vérifier si le Marketplace a l'approbation pour ce NFT
check-approval:
	@echo "✅ Vérification de l'approbation pour le NFT..."
	cast call $(NFT_ADDRESS) "getApproved(uint256)" $(TOKEN_ID) --rpc-url $(RPC_URL)

# Approuver le Marketplace pour le NFT (à exécuter si check-approval n'affiche pas l'adresse du Marketplace)
approve-marketplace:
	@echo "🔑 Approbation du Marketplace pour le NFT..."
	cast send $(NFT_ADDRESS) "approve(address,uint256)" $(MARKETPLACE_ADDRESS) $(TOKEN_ID) \
	--rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY)

# Envoyer la transaction pour lister l'item (après avoir approuvé)
send-list-item:
	@echo "📝 Envoi de la transaction listItem..."
	cast send $(MARKETPLACE_ADDRESS) "listItem(address,uint256,uint256)" $(NFT_ADDRESS) $(TOKEN_ID) $(PRICE) \
	--rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY)

# Transférer le NFT au Marketplace via transferToFeeAdminMarketPlace
transfer-to-marketplace:
	@echo "🔄 Transfert du NFT au Marketplace..."
	cast send $(MARKETPLACE_ADDRESS) "transferToFeeAdminMarketPlace(address,uint256)" $(NFT_ADDRESS) $(TOKEN_ID) \
	--rpc-url $(RPC_URL) --private-key $(PRIVATE_KEY)

# Commande pour tout déboguer en séquence
debug-all: check-owner check-approval

# Aide
help:
	@echo "Commandes disponibles:"
	@echo "  make check-owner            - Vérifier le propriétaire actuel du NFT"
	@echo "  make check-approval         - Vérifier si le Marketplace a l'approbation pour ce NFT"
	@echo "  make approve-marketplace    - Approuver le Marketplace pour gérer le NFT"
	@echo "  make call-list-item         - Simuler l'appel à listItem (pour voir les erreurs)"
	@echo "  make send-list-item         - Envoyer la transaction listItem"
	@echo "  make transfer-to-marketplace - Transfert du NFT au Marketplace"
	@echo "  make debug-all              - Exécuter toutes les vérifications"
	@echo ""
	@echo "⚠️ N'oubliez pas de remplacer YOUR_INFURA_KEY et your_private_key_here dans le Makefile"

.PHONY: call-list-item check-owner check-approval approve-marketplace send-list-item transfer-to-marketplace debug-all help