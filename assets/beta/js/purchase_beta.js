let siteCaptchaKey = "6Ld23NkUAAAAABDh7m17tDDwAdUDRwNb-9Tk0jbp";
let protocol = window.location.protocol;
let token = localStorage.getItem("token");

$(document).ready(async () => {
  let fp;
  let blockerEnabled = true;

  if (token) {
    let response = await fetch(`${protocol}//api.rbx.cool/users/me`, {
      headers: {
        authorization: token,
      },
    });

    let json = await response.json();

    if (response.status !== 200) return (document.location.href = "/login");

    this.user = json.data;

    $("#stock").text(`R$${this.user.stock.toLocaleString()}`);
    $("#loginBtnLink").hide();
    $("#registerBtnLink").hide();
  } else {
    return (document.location.href = "/login");
  }

  let metaResponse = await fetch(`${protocol}//api.rbx.cool/purchases/meta`);
  let metaJson = await metaResponse.json();

  $("#rates").text(metaJson.data.rates.toFixed(2));

  if (window.requestIdleCallback) {
    requestIdleCallback(() => {
      if (typeof Fingerprint2 == "undefined")
        return showError(
          "Disable your ad blocker and refresh the page to continue!"
        );

      Fingerprint2.get((components) => {
        fp = Fingerprint2.x64hash128(
          components
            .map((p) => {
              return p.value;
            })
            .join(),
          31
        );
        blockerEnabled = components.find((c) => c.key == "adBlock").value;
        if (!fp || blockerEnabled == true)
          return showError(
            "Disable your ad blocker and refresh the page to continue!"
          );
      });
    });
  } else {
    setTimeout(() => {
      if (typeof Fingerprint2 == "undefined")
        return showError(
          "Disable your ad blocker and refresh the page to continue!"
        );

      Fingerprint2.get((components) => {
        fp = Fingerprint2.x64hash128(
          components
            .map((p) => {
              return p.value;
            })
            .join(),
          31
        );
        blockerEnabled = components.find((c) => c.key == "adBlock").value;
        if (!fp || blockerEnabled == true)
          return showError(
            "Disable your ad blocker and refresh the page to continue!"
          );
      });
    }, 500);
  }

  const postPurchase = async (method) => {
    let amount = $("#amountInput").val();

    let response = await fetch(
      `${protocol}//api.rbx.cool/purchases/beta/crypto/checkout`,
      {
        method: "POST",
        headers: {
          authorization: token,
          "content-type": "application/json",
          fp: fp,
        },
        body: JSON.stringify({
          amount: amount,
        }),
      }
    );

    let json = await response.json();

    if (response.status !== 200) return showError(json.error.message);

    document.location.href = json.data.url;
  };

  $("#bitcoinCheckout").click(() => {
    postPurchase();
  });

  $("#checkoutForm").submit((event) => {
    event.preventDefault();
  });

  $("#amountInput").on("input", () => {
    $("#price").text(
      `$${(
        (parseInt($("#amountInput").val() || 0) / 1000) *
        metaJson.data.rates
      ).toFixed(2)}`
    );
  });

  $("input[name=method]").change(() => {
    let id = $("input[name=method]:checked").attr("id");

    if (id == "paypal") {
      let container = $(".paypal-btn");
      let cryptoContainer = $(".bitcoin-btn");
      if (container.hasClass("d-none")) {
        container.removeClass("d-none");
      }

      if (!cryptoContainer.hasClass("d-none")) {
        cryptoContainer.addClass("d-none");
      }
    }

    if (id == "bitcoin") {
      let container = $(".bitcoin-btn");
      let paypalContainer = $(".paypal-btn");

      if (container.hasClass("d-none")) {
        container.removeClass("d-none");
      }

      if (!paypalContainer.hasClass("d-none")) {
        paypalContainer.addClass("d-none");
      }
    }
  });

  paypal
    .Buttons({
      style: {
        size: "responsive",
      },
      createOrder: () => {
        //error handling should be fixed here
        return fetch("https://api.rbx.cool/purchases/beta/paypal/checkout", {
          method: "post",
          headers: {
            authorization: token,
            "content-type": "application/json",
            fp: fp,
          },
          body: JSON.stringify({
            amount: $("#amountInput").val(),
          }),
        })
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            if (data.status == "error") return showError(data.error.message);

            console.log(data);
            return data.orderID;
          })
          .catch((err) => {
            console.log(err);
            showError("Error creating payment!");
          });
      },
      onApprove: (data, actions) => {
        //error handling should be fixed here
        return fetch(
          "https://api.rbx.cool/purchases/beta/paypal/checkout/complete",
          {
            method: "post",
            headers: {
              authorization: token,
              "content-type": "application/json",
              fp: fp,
            },
            body: JSON.stringify({ orderID: data.orderID }),
          }
        )
          .then((res) => {
            return res.json();
          })
          .then((data) => {
            if (data.status == "error") return showError(data.error.message);

            return showPurchaseSuccess(data.data.message);
          })
          .catch((err) => {
            console.log(err);
            showError("Error creating payment!");
          });
      },
    })
    .render(".paypal-btn");
});

$("#logoutHeaderBtn").click(async () => {
  let response = await fetch(`${protocol}//api.rbx.cool/users/me/logout`, {
    method: "POST",
    headers: {
      authorization: token,
    },
  });

  let json = await response.json();

  if (response.status !== 200) return showError(json.error.message);

  localStorage.removeItem("token");
  document.location.href = "/login";
});
