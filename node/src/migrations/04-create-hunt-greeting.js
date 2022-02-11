'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hunt_greeting', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      frn_dpaccountid: {
        type: Sequelize.BIGINT,
        references: { model: 'dpaccount', key: 'id' }
      },
      greeting_label: {
        type: Sequelize.STRING
      },
      greeting_file: {
        type: Sequelize.STRING
      },
      greeting_active: {
        type: Sequelize.BOOLEAN
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hunt_greeting');
  }
};
