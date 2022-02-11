'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('userperm', {
      id: {
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      permission_description: {
        type: Sequelize.STRING
      },
      allow_edit: {
        type: Sequelize.SMALLINT
      },
      sort_order: {
        type: Sequelize.SMALLINT
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('userperm');
  }
};
