'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hunt_ring_did', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      frn_huntid: {
        type: Sequelize.BIGINT,
        references: { model: 'hunt', key: 'id' }
      },
      frn_ring_didid: {
        type: Sequelize.BIGINT,
        references: { model: 'ring_did', key: 'id' }
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('hunt_ring_did');
  }
};
