<#macro emailLayout>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0; padding:0; background-color:#eef2f5; font-family: 'Source Sans Pro', Helvetica, Arial, sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef2f5; padding:24px 0;">
  <tr>
    <td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:4px; overflow:hidden; box-shadow:0 2px 8px rgba(1,48,68,0.15);">
        <tr>
          <td style="background-color:#0b3d2e; padding:20px 28px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48" valign="middle">
                  <img src="${url.resourcesUrl}/img/gizmo-seal.png" width="40" height="40" alt="gizmoshop" style="display:block; border:0;">
                </td>
                <td valign="middle" style="padding-left:12px; color:#ffffff; font-size:16px; font-weight:700;">
                  gizmoshop
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="border-top:4px solid #0f6a44;"></td>
        </tr>
        <tr>
          <td style="padding:32px 28px; color:#333333; font-size:15px; line-height:1.55;">
            <#nested>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f5f5f5; padding:16px 28px; color:#777777; font-size:12px; line-height:1.5; border-top:1px solid #ddd;">
            This is an automated message from gizmoshop. Please do not reply directly to this email.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
</#macro>
