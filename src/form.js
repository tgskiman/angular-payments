angular.module('angularPayments')

.directive('stripeForm', ['$window', '$parse', 'Common', function($window, $parse, Common) {
    
  // directive intercepts form-submission, obtains Stripe's cardToken using stripe.js
  // and then passes that to callback provided in stripeForm, attribute.

  // data that is sent to stripe is filtered from scope, looking for valid values to
  // send and converting camelCase to snake_case, e.g expMonth -> exp_month


  // filter valid stripe-values from scope and convert them from camelCase to snake_case
    _getDataToSend = function(data){
         
        var ret = {};

        ret.number = data.card.number;
        ret.exp_month = data.card.expMonth;
        ret.exp_year = data.card.expYear;
        ret.cvc = data.card.cvc;
        ret.name = data.payeeName;
        ret.address_line1 = data.address.streetNumber;
        ret.address_city = data.address.city;
        ret.address_state = data.address.state;
        ret.address_zip = data.address.zip;
        ret.address_country = "US";

        ret['number'] = (ret['number'] || '').replace(/ /g,'');

        return ret;
    }

  return {
    restrict: 'A',
    scope: {
        payment: '=',
        paymentSuccess: '&onPaymentSuccess'
    },

    link: function(scope, elem, attr) {

      if(!$window.Stripe){
          throw 'stripeForm requires that you have stripe.js installed. Include https://js.stripe.com/v2/ into your html.';
      }

      

      var form = angular.element(elem);

      form.bind('submit', function () {
          if (scope.payment.paymentType == "check") {
              return;
          }

        expMonthUsed = scope.payment.card.expMonth ? true : false;
        expYearUsed = scope.payment.card.expYear ? true : false;

        if(!(expMonthUsed && expYearUsed)){
          exp = Common.parseExpiry(scope.payment.card.expiry)
          scope.payment.card.expMonth = exp.month
          scope.payment.card.expYear = exp.year
        }

        var button = form.find('button');
        button.prop('disabled', true);

        

        if (form.hasClass('ng-valid')) {

            $window.Stripe.createToken(_getDataToSend(scope.payment), function (status, response) {
                if (response.error) {
                    scope.payment.errorText = response.error.message;
                    button.prop('disabled', false);

                }
                else {
                    scope.payment.card.number = null;
                    scope.payment.card.cvc = null;
                    scope.payment.card.expiry = null;
                    scope.payment.card.expMonth = null;
                    scope.payment.card.expYear = null;
                    scope.payment.card.stripeToken = response.id;
                    button.prop('disabled', false);
                    scope.paymentSuccess();
                }

          });

        } else {
            button.prop('disabled', false);
        }

        scope.payment.card.expMonth = null;
        scope.payment.card.expYear  = null;

      });
    }
  }
}]);
