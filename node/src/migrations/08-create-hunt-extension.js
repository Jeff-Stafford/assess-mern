'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hunt_extension', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      frn_huntid: {
        type: Sequelize.BIGINT,
        references: { model: 'hunt', key: 'id' }
      },
      extension_digit: {
        type: Sequelize.INTEGER
      },
      extension_label: {
        type: Sequelize.STRING
      },
      forward_huntid: {
        type: Sequelize.BIGINT,
        references: { model: 'hunt', key: 'id' }
      },
      extension_active: {
        type: Sequelize.BOOLEAN
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hunt_extension');
  }
};
