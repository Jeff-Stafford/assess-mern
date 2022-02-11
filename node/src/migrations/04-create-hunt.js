'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hunt', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      frn_dpaccountid: {
        type: Sequelize.BIGINT,
        references: { model: 'dpaccount', key: 'id' }
      },
      hunt_label: {
        type: Sequelize.STRING
      },
      frn_hunt_typeid: {
        type: Sequelize.BIGINT,
        references: { model: 'hunt_type', key: 'id' }
      },
      frn_hunt_greetingid: {
        type: Sequelize.BIGINT,
        references: { model: 'hunt_greeting', key: 'id' },
        allowNull: true
      },
      hunt_active: {
        type: Sequelize.BOOLEAN
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hunt');
  }
};
