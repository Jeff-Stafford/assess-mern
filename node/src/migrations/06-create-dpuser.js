'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      'dpuser',
      {
        id: {
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.BIGINT
        },
        frn_dpaccountid: {
          type: Sequelize.BIGINT,
          references: {
            model: 'dpaccount',
            key: 'id'
          }
        },
        name_first: {
          type: Sequelize.STRING
        },
        name_last: {
          type: Sequelize.STRING
        },
        avatar: {
          allowNull: true,
          type: Sequelize.STRING
        },
        frn_dpnumberid: {
          type: Sequelize.BIGINT,
          references: {
            model: 'dpnumber',
            key: 'id'
          },
          unique: true
        },
        available: {
          type: Sequelize.BOOLEAN
        },
        email: {
          type: Sequelize.STRING,
          unique: true
        },
        user_active: {
          type: Sequelize.BOOLEAN
        },
        frn_dpcustomerid: {
          type: Sequelize.BIGINT,
          references: {
            model: 'dpcustomer',
            key: 'id'
          }
        },
        voicemail_huntid: {
          type: Sequelize.BIGINT,
          references: {
            model: 'hunt',
            key: 'id'
          }
        },
        verificationCode: {
          type: Sequelize.INTEGER
        },
        verificationCodeCreatedAt: {
          type: Sequelize.DATE,
          allowNull: true
        }
      },
      {
        timestamps: false
      }
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('dpuser');
  }
};
