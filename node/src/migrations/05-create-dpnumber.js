'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('dpnumber', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      number_did: {
        type: Sequelize.STRING
      },
      number_label: {
        type: Sequelize.STRING
      },
      frn_dpnumber_typeid: {
        type: Sequelize.BIGINT,
        references: { model: 'dpnumber_type', key: 'id' }
      },
      forward_huntid: {
        type: Sequelize.BIGINT,
        references: { model: 'hunt', key: 'id' }
      },
      fallback_huntid: {
        type: Sequelize.BIGINT,
        references: { model: 'hunt', key: 'id' }
      },
      frn_platform_partnerid: {
        type: Sequelize.BIGINT
      },
      number_active: {
        type: Sequelize.BOOLEAN
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('dpnumber');
  }
};
