<#macro emailLayout>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#eef2f4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f4;padding:24px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0"
                   style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #dfe5e8;border-radius:16px;overflow:hidden;">
                <tr>
                    <td style="background:linear-gradient(180deg,#0B3D2E 20%,#0F6A44 100%);background-color:#0B3D2E;padding:28px 24px;text-align:center;">
                        <img src="${url.resourcesUrl}/img/gizmo-logo.png"
                             alt="gizmoshop"
                             width="72"
                             style="display:block;margin:0 auto 10px;width:72px;height:auto;border:0;">
                        <div style="color:#ffffff;font-family:'Source Sans Pro','Segoe UI',Arial,sans-serif;font-size:18px;font-weight:600;line-height:1.3;">
                            gizmoshop
                        </div>
                    </td>
                </tr>
                <tr>
                    <td style="padding:32px 36px;font-family:'Source Sans Pro','Segoe UI',Arial,sans-serif;font-size:15px;color:#333333;line-height:1.6;">
                        <#nested>
                    </td>
                </tr>
                <tr>
                    <td style="background-color:#f5f7f8;border-top:1px solid #dfe5e8;padding:18px 36px;font-family:'Source Sans Pro','Segoe UI',Arial,sans-serif;font-size:12px;color:#6a7a83;text-align:center;line-height:1.5;">
                        gizmoshop<br>
                        100 Industrial Way, Springfield, OH 45501<br>
                        <a href="https://gizmoshop.example" style="color:#2FA36B;text-decoration:none;">gizmoshop.example</a>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
</#macro>
