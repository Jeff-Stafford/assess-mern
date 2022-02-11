'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ring_did', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      frn_dpaccountid: {
        type: Sequelize.BIGINT,
        references: { model: 'dpaccount', key: 'id' }
      },
      did_label: {
        type: Sequelize.STRING
      },
      did_value: {
        type: Sequelize.STRING
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ring_did');
  }
};
