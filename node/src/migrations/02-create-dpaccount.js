'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('dpaccount', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      account_name: {
        type: Sequelize.STRING
      },
      account_logo: {
        type: Sequelize.STRING
      },
      account_active: {
        type: Sequelize.BOOLEAN
      },
      timezone_offset: {
        type: Sequelize.SMALLINT
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('dpaccount');
  }
};
