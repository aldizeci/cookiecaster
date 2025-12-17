import {FormattedMessage} from "react-intl";



export default function ResponsiveLayout({children}){
    return(
        <>
            { /* MOBILE VERSION */ }
            <div className="p-5 bg-light rounded text-center d-block d-md-none">
                 <h2>
                    <FormattedMessage
                        id="layout.device"
                        defaultMessage="Please use a tablet or desktop device."
                    />
                </h2>
            </div>

            {/* Querformat */}
            <div className="p-5 bg-light d-none d-md-block d-lg-none">
                <h2>
                    <FormattedMessage
                        id="layout.querformat"
                        defaultMessage="Please use a tablet or desktop device."
                    />
                </h2>
            </div>

            <div className="start-root d-none d-lg-block">
                {children}
            </div>
        </>
    )
}