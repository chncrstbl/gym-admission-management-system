import DevCards from "../../components/Cards/DevCards";
import HomeLayout from "../../layouts/HomeLayout";
import teamMember1 from "../../assets/images/profile-1.png";
import teamMember2 from "../../assets/images/profile-2.png";
import teamMember3 from "../../assets/images/profile-3.png";
import teamMember4 from "../../assets/images/profile-4.png";

const Home = () => {
    return (
        <HomeLayout title="Gym Admission Management System">
            <>
                <div className="p-4 md:p-10 flex flex-col items-center">
                    <div className="w-full max-w-6xl">
                        <div className="max-w-6xl mx-auto">
                            <h2 className="text-lg font-normal text-gray-800 uppercase mb-4 tracking-tight">
                                Team Behind
                            </h2>
                        </div>

                        <div className="border border-gray-300 bg-white p-4 md:p-8 flex flex-wrap justify-center gap-4 md:gap-8">
                                <DevCards name="Nen" picture={teamMember1}/>
                                <DevCards name="Zy" picture={teamMember2}/>
                                <DevCards name="Jam" picture={teamMember3}/>
                                <DevCards name="Nel" picture={teamMember4}/>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-8 font-sans">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-lg font-normal text-gray-800 uppercase mb-4 tracking-tight">
                            Support Email
                        </h2>
                        <div className="border border-gray-300 bg-white p-4 md:p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 uppercase text-sm mb-4 md:mb-6">
                                Contact Us
                            </h3>
                            <div className="space-y-4 md:space-y-6 text-gray-700 leading-relaxed text-sm md:text-base">
                                <p> 
                                    For any concerns, please email to 
                                    <a href="mailto:cristobalchristiand2906@gmail.com" className="ml-1 font-bold text-black hover:underline break-all">
                                        cristobalchristiand2906@gmail.com
                                    </a>.
                                </p>
                                <p>Thank you for your cooperation!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        </HomeLayout>
    );
};

export default Home;