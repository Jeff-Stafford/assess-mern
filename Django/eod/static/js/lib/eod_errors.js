(function() {

  'use strict';

  jQuery.fn.extend({

    monitorForErrors: function(hasErrorCallback) {

      jQuery(this).each(function (_, form) {

        $(form).on("submit", function (e) {

          let $form = $(this),
              res = true;

          $form.find("input[data-required='yes']:radio").each(function (index, input) {

            let $input = $(input),
                name = $input.prop("name");

            if (typeof $(`input[name='${name}']:checked`).val() === "undefined") {
              $input.parents("div.form-group").css("background-color", "#f2dede");
              $input.parents("div.form-group").css("color", "#a94442");
              res = hasErrorCallback(name);
            } else {
              $input.parents("div.form-group").css("background-color", "transparent");
              $input.parents("div.form-group").css("color", "#000");
            }

          });

          $form.find("[data-required='yes']").each(function (index, input) {

            let $input = $(input);

            if ($input.is('input')) {
              if ($input.val().length == 0) {
                $input.parents("div.form-group").addClass("has-error");
                res = hasErrorCallback($input.attr("name"));
              } else {
                $input.parents("div.form-group").removeClass("has-error");
              }
            }

            if ($input.is('select')) {
              if ($input.val().length == 0) {
                $input.parents("div.form-group").addClass("has-error");
                res = hasErrorCallback($input.attr("name"));
              } else {
                $input.parents("div.form-group").removeClass("has-error");
              }
            }

          });

          // if form is valid, try to see whether or not address functions are selected
          if (res) {
            let problem_zones = [];
            $("[data-object='address-functions']").each(function (index, block) {
              problem_zones.push({
                index: index,
                unchecked: ($(block).find("input:checked").length === 0),
              });
            });
            let first_problem_zone = problem_zones.find(function (element) {
              return element.unchecked === true;
            });
            res = problem_zones.every(function(val) { return val.unchecked === false });
            if (typeof first_problem_zone !== "undefined") {
              hasErrorCallback(`address-${first_problem_zone.index}-functions`);
            }
          }

          return res;

        });

      });
    }

  });

})();
