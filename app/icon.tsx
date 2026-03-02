import { ImageResponse } from 'next/og'

export const size = {
    width: 32,
    height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: 'linear-gradient(to bottom right, #10b981, #047857)',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '20%',
                    fontSize: 20,
                    fontWeight: 900,
                    fontFamily: 'sans-serif'
                }}
            >
                S
            </div>
        ),
        {
            ...size,
        }
    )
}
