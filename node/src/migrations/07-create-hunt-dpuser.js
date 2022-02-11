'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hunt_dpuser', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      frn_huntid: {
        type: Sequelize.BIGINT,
        references: {
          model: 'hunt',
          key: 'id'
        }
      },
      frn_dpuserid: {
        type: Sequelize.BIGINT,
        references: {
          model: 'dpuser',
          key: 'id'
        }
      },
      hunt_dpuser_active: {
        type: Sequelize.BOOLEAN
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('hunt_dpuser');
  }
};
