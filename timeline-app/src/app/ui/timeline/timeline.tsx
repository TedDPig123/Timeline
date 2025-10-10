export default function Timeline(){
    return (
        <div className="gallery bg-white w-300 h-200 overflow-x-scroll">
            <div className="w-full h-full flex flex-col justify-center">
                <div className="timeline-top grow flex align-center w-fit">
                    <div className="bg-black w-50 h-50 mx-5 mt-auto"></div>
                    <div className="bg-black w-50 h-50 mx-5 mt-auto"></div>
                    <div className="bg-black w-50 h-50 mx-5 mt-auto"></div>
                    <div className="bg-black w-50 h-50 mx-5 mt-auto"></div>
                    <div className="bg-black w-50 h-50 mx-5 mt-auto"></div>
                    <div className="bg-black w-50 h-50 mx-5 mt-auto"></div>
                    <div className="bg-black w-50 h-50 mx-5 mt-auto"></div>
                    <div className="bg-black w-50 h-50 mx-5 mt-auto"></div>
                </div>

                <div className="timeline-gap bg-yellow-300 w-full h-2"></div>

                <div className="timeline-bottom grow flex w-fit">
                    <div className="bg-black w-50 h-50 mx-5"></div>
                    <div className="bg-black w-50 h-50 mx-5"></div>
                    <div className="bg-black w-50 h-50 mx-5"></div>
                    <div className="bg-black w-50 h-50 mx-5"></div>
                    <div className="bg-black w-50 h-50 mx-5"></div>
                    <div className="bg-black w-50 h-50 mx-5"></div>
                    <div className="bg-black w-50 h-50 mx-5"></div>
                    <div className="bg-black w-50 h-50 mx-5"></div>
                </div>
            </div>
        </div>
    )
}