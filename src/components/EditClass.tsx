import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';

export function EditClass({ onNavigate }: { onNavigate: (s: string) => void }) {
  return (
    <div className="flex flex-col h-full w-full font-display pb-[140px]">
      <header className="flex items-center bg-background-dark p-4 border-b-2 border-border-harsh sticky top-0 z-50">
        <button 
          onClick={() => onNavigate('ROSTER')}
          className="mr-4 text-text-main hover:text-primary active:text-primary flex items-center justify-center w-10 h-10 border-2 border-transparent hover:border-border-harsh focus:border-border-harsh focus:outline-none">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold tracking-tight uppercase">&gt; EDIT_CLASS</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto flex flex-col w-full p-4 space-y-8">
        <section className="flex flex-col space-y-2">
          <label className="text-sm font-bold text-muted uppercase tracking-wider" htmlFor="class_name">CLASS_NAME</label>
          <input 
            className="border-2 border-muted bg-background-dark text-text-main w-full h-16 px-4 text-xl font-bold placeholder:text-muted uppercase tracking-wider focus:border-text-main focus:outline-none" 
            id="class_name" 
            placeholder="ENTER_CLASS_NAME_" 
            type="text" 
            defaultValue="ADVANCED_ESL_01" 
          />
        </section>
        
        <section className="flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b-2 border-border-harsh pb-2">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider">ASSIGNED_STUDENTS [ 3 ]</h2>
          </div>
          <div className="flex flex-col space-y-2">
            {/* Assigned Student 1 */}
            <div className="flex items-center justify-between bg-surface border-2 border-border-harsh p-3">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 bg-border-harsh flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted">01</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold truncate uppercase">NGUYEN_ANH</span>
                  <span className="text-xs text-muted font-medium uppercase">ID: STU_9021</span>
                </div>
              </div>
              <button className="shrink-0 ml-4 h-10 px-4 border-2 border-primary text-primary font-bold text-sm uppercase hover:bg-primary hover:text-black focus:outline-none focus:bg-primary focus:text-black">
                [ REMOVE ]
              </button>
            </div>
            {/* Assigned Student 2 */}
            <div className="flex items-center justify-between bg-surface border-2 border-border-harsh p-3">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 bg-border-harsh flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted">02</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold truncate uppercase">TRAN_BAO</span>
                  <span className="text-xs text-muted font-medium uppercase">ID: STU_4432</span>
                </div>
              </div>
              <button className="shrink-0 ml-4 h-10 px-4 border-2 border-primary text-primary font-bold text-sm uppercase hover:bg-primary hover:text-black focus:outline-none focus:bg-primary focus:text-black">
                [ REMOVE ]
              </button>
            </div>
            {/* Assigned Student 3 */}
            <div className="flex items-center justify-between bg-surface border-2 border-border-harsh p-3">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 bg-border-harsh flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted">03</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold truncate uppercase">LE_CHAU</span>
                  <span className="text-xs text-muted font-medium uppercase">ID: STU_1198</span>
                </div>
              </div>
              <button className="shrink-0 ml-4 h-10 px-4 border-2 border-primary text-primary font-bold text-sm uppercase hover:bg-primary hover:text-black focus:outline-none focus:bg-primary focus:text-black">
                [ REMOVE ]
              </button>
            </div>
          </div>
        </section>
        
        <section className="flex flex-col space-y-4 pt-4">
          <div className="flex items-center justify-between border-b-2 border-border-harsh pb-2">
            <h2 className="text-sm font-bold text-muted uppercase tracking-wider">AVAILABLE_STUDENTS</h2>
            <div className="flex items-center border-2 border-border-harsh bg-black px-2 py-1">
              <Search className="text-muted w-4 h-4" />
              <input 
                className="bg-transparent border-none text-xs text-text-main placeholder:text-muted focus:ring-0 focus:outline-none w-20 px-1 py-0 h-5 uppercase" 
                placeholder="FILTER_" 
                type="text" 
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            {/* Available Student 1 */}
            <div className="flex items-center justify-between bg-black border-2 border-border-harsh border-dashed p-3">
              <div className="flex items-center space-x-3 overflow-hidden opacity-70">
                <div className="w-8 h-8 border-2 border-border-harsh flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted">--</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold text-muted truncate uppercase">PHAM_DUY</span>
                  <span className="text-xs text-muted font-medium uppercase">ID: STU_8871</span>
                </div>
              </div>
              <button className="shrink-0 ml-4 h-10 px-4 bg-accent text-black font-bold text-sm uppercase hover:bg-white focus:outline-none focus:bg-white border-2 border-accent hover:border-white focus:border-white">
                [ ADD ]
              </button>
            </div>
            {/* Available Student 2 */}
            <div className="flex items-center justify-between bg-black border-2 border-border-harsh border-dashed p-3">
              <div className="flex items-center space-x-3 overflow-hidden opacity-70">
                <div className="w-8 h-8 border-2 border-border-harsh flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted">--</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base font-bold text-muted truncate uppercase">HOANG_YEN</span>
                  <span className="text-xs text-muted font-medium uppercase">ID: STU_2345</span>
                </div>
              </div>
              <button className="shrink-0 ml-4 h-10 px-4 bg-accent text-black font-bold text-sm uppercase hover:bg-white focus:outline-none focus:bg-white border-2 border-accent hover:border-white focus:border-white">
                [ ADD ]
              </button>
            </div>
          </div>
        </section>
      </main>
      
      <div className="fixed bottom-0 left-0 right-0 bg-background-dark border-t-2 border-border-harsh p-4 z-50">
        <div className="max-w-3xl mx-auto flex flex-col space-y-3">
          <button 
            onClick={() => onNavigate('ROSTER')}
            className="w-full h-14 bg-accent text-black font-bold text-lg uppercase flex items-center justify-center border-2 border-accent hover:bg-white hover:border-white focus:outline-none focus:bg-white focus:border-white">
            [ SAVE_CLASS ]
          </button>
          <button 
            onClick={() => onNavigate('ROSTER')}
            className="w-full h-14 bg-black text-primary font-bold text-lg uppercase flex items-center justify-center border-2 border-primary hover:bg-primary hover:text-black focus:outline-none focus:bg-primary focus:text-black">
            [ DELETE_CLASS ]
          </button>
        </div>
      </div>
    </div>
  );
}
