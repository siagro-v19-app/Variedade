sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"br/com/idxtecVariedade/services/Session"
], function(Controller, MessageBox, JSONModel, Filter, FilterOperator, Session) {
	"use strict";

	return Controller.extend("br.com.idxtecVariedade.controller.Variedade", {
		onInit: function(){
			var oJSONModel = new JSONModel();
			
			this._operacao = null;
			this._sPath = null;

			this.getOwnerComponent().setModel(oJSONModel, "model");
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			
			var oFilter = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
			var oView = this.getView();
			var oTable = oView.byId("tableVariedade");
			
			oTable.bindRows({
				path: '/Variedades',
				sorter: {
					path: 'Descricao'
				},
				filters: oFilter
			});
		},
		
		filtraVariedade: function(oEvent){
			var sQuery = oEvent.getParameter("query").toUpperCase();
			var oFilter1 = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
			var oFilter2 = new Filter("Descricao", FilterOperator.Contains, sQuery);
			
			var aFilters = [
				oFilter1,
				oFilter2
			];

			this.getView().byId("tableVariedade").getBinding("rows").filter(aFilters, "Application");
		},
		
		onRefresh: function(){
			var oModel = this.getOwnerComponent().getModel();
			oModel.refresh(true);
			this.getView().byId("tableVariedade").clearSelection();
		},
		
		onIncluir: function(){
			var oDialog = this._criarDialog();
			var oTable = this.byId("tableVariedade");
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oViewModel = this.getModel("view");
			
			oViewModel.setData({
				titulo: "Inserir Variedade",
				msgSave: "Variedade inserida com sucesso!"
			});
			
			this._operacao = "incluir";
			
			var oNovoVariedade = {
				"Id": 0,
				"Descricao": "",
				"Empresa" : Session.get("EMPRESA_ID"),
				"Usuario": Session.get("USUARIO_ID"),
				"EmpresaDetails": { __metadata: { uri: "/Empresas(" + Session.get("EMPRESA_ID") + ")"}},
				"UsuarioDetails": { __metadata: { uri: "/Usuarios(" + Session.get("USUARIO_ID") + ")"}}
			};
			
			oJSONModel.setData(oNovoVariedade);
			
			oTable.clearSelection();
			oDialog.open();
		},
		
		onEditar: function(){
			var oDialog = this._criarDialog();
			var oTable = this.byId("tableVariedade");
			var nIndex = oTable.getSelectedIndex();
			var oModel = this.getOwnerComponent().getModel();
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oViewModel = this.getModel("view");
			
			oViewModel.setData({
				titulo: "Editar Variedade",
				msgSave: "Variedade alterada com sucesso!"
			});
			
			this._operacao = "editar";
			
			if(nIndex === -1){
				MessageBox.warning("Selecione uma variedade da tabela!");
				return;
			}
			
			var oContext = oTable.getContextByIndex(nIndex);
			this._sPath = oContext.sPath;
			
			oModel.read(oContext.sPath, {
				success: function(oData){
					oJSONModel.setData(oData);
				}
			});
			
			oTable.clearSelection();
			oDialog.open();
		},
		
		onRemover: function(){
			var that = this;
			var oTable = this.byId("tableVariedade");
			var nIndex = oTable.getSelectedIndex();
			
			if(nIndex === -1){
				MessageBox.warning("Selecione uma variedade da tabela!");
				return;
			}
			
			MessageBox.confirm("Deseja remover essa variedade?", {
				onClose: function(sResposta){
					if(sResposta === "OK"){
						MessageBox.success("Variedade removida com sucesso!");
						that._remover(oTable, nIndex);
					} 
				}      
			});
		},
		
		_remover: function(oTable, nIndex){
			var oModel = this.getOwnerComponent().getModel();
			var oContext = oTable.getContextByIndex(nIndex);
			
			oModel.remove(oContext.sPath,{
				success: function(){
					oModel.refresh(true);
					oTable.clearSelection();
				}
			});
		},
		
		_criarDialog: function(){
			var oView = this.getView();
			var oDialog = this.byId("VariedadeDialog"); 
			
			if(!oDialog){
				oDialog = sap.ui.xmlfragment(oView.getId(), "br.com.idxtecVariedade.view.VariedadeDialog", this);
				oView.addDependent(oDialog);
			}
			
			return oDialog;
		},
		
		onSaveDialog: function(){
			if (this._checarCampos(this.getView())) {
				MessageBox.warning("Preencha todos os campos obrigatórios!");
				return;
			}
			if(this._operacao === "incluir"){
				this._createVariedade();
				this.getView().byId("VariedadeDialog").close();
			} else if(this._operacao === "editar"){
				this._updateVariedade();
				this.getView().byId("VariedadeDialog").close();
			} 
		},
		
		_getDados: function(){
			var oJSONModel = this.getOwnerComponent().getModel("model");
			var oDados = oJSONModel.getData();
			
			return oDados;
		},
		
		_createVariedade: function(){
			var oModel = this.getOwnerComponent().getModel();
	
			oModel.create("/Variedades", this._getDados(), {
				success: function() {
					MessageBox.success("Variedade inserida com sucesso!");
					oModel.refresh(true);
				}
			});
		},
		
		_updateVariedade: function(){
			var oModel = this.getOwnerComponent().getModel();
			
			oModel.update(this._sPath, this._getDados(), {
				success: function(){
					MessageBox.success("Variedade alterada com sucesso!");
					oModel.refresh(true);
				}
			});
		},
		
		onCloseDialog: function(){
			var oModel = this.getOwnerComponent().getModel();
			
			if(oModel.hasPendingChanges()){
				oModel.resetChanges();
			}
			
			this.byId("VariedadeDialog").close();
		},
		
		_checarCampos: function(oView){
			if(oView.byId("descricao").getValue() === ""){
				return true; 
			}else{
				return false; 
			}
		},
		
		getModel: function(sModel) {
			return this.getOwnerComponent().getModel(sModel);
		}
	});
});