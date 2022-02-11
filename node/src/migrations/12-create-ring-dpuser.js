'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('ring_dpuser', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      frn_dpuserid: {
        type: Sequelize.BIGINT,
        references: { model: 'dpuser', key: 'id' }
      },
      frn_ring_dpuser_typeid: {
        type: Sequelize.BIGINT,
        references: { model: 'ring_dpuser_type', key: 'id' }
      },
      ring_value: {
        type: Sequelize.STRING
      },
      ring_participate: {
        type: Sequelize.SMALLINT
      },
      ring_active: {
        type: Sequelize.INTEGER
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('ring_dpuser');
  }
};
