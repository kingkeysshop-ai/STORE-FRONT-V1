"use client"

import { HttpTypes } from "@medusajs/types"
import React from "react"

type AurpayPaymentButtonProps = {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}

const AurpayPaymentButton: React.FC<AurpayPaymentButtonProps> = ({
  notReady,
  "data-testid": dataTestId,
}) => {
  const aurpayToken =
    process.env.NEXT_PUBLIC_AURPAY_TOKEN ||
    "pb_plugin_code_token_rIFrCPy0e4JrPzjt"

  return (
    <form
      id="aurpay_pb_code"
      data-testid={dataTestId}
      aria-disabled={notReady}
      style={notReady ? { opacity: 0.5, pointerEvents: "none" } : undefined}
    >
      <script
        src="https://pb.aurpay.net/pb/page/js/paymentbutton.js"
        data-payment_button_token={aurpayToken}
        async={true}
      />
      <a
        href={`https://pb.aurpay.net/pb/page/html/paymentbutton.html?token=${aurpayToken}`}
        style={{ textDecoration: "none" }}
        target="_blank"
        rel="noreferrer"
      >
        <button
          type="button"
          style={{
            boxShadow:
              "0 5px 30px 2px rgb(0 0 0 / 0.06), 0 3px 15px -4px rgb(0 0 0 / 0.06)",
            cursor: "pointer",
            height: "54px",
            paddingLeft: "20px",
            boxSizing: "border-box",
            border: "none",
            outline: "none",
            background: "#23275D",
            borderRadius: "5px",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
          }}
          disabled={notReady}
        >
          <img
            style={{ width: "24px", height: "24px" }}
            src="https://aurpay.net/wp-content/uploads/2022/06/favicon-logo.png"
            alt="logo"
          />
          <span
            style={{
              display: "block",
              height: "54px",
              backgroundColor: "#191D48",
              padding: "12px 20px",
              boxSizing: "border-box",
              transform: "skewX(-15deg) translateX(0.875rem)",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "block",
                color: "#FFFFFF",
                fontSize: "14px",
                marginBottom: "4px",
                transform: "skewX(8deg)",
                fontWeight: 700,
              }}
            >
              Pay with Aurpay
            </span>
            <span
              style={{
                display: "block",
                fontSize: "10px",
                color: "#FFFFFF",
                opacity: 0.5,
                transform: "skewX(6deg)",
              }}
            >
              Secured by Aurpay
            </span>
          </span>
        </button>
      </a>
    </form>
  )
}

export default AurpayPaymentButton
